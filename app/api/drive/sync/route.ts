import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMode } from "@/lib/mode";
import { canSeeInbox } from "@/lib/visibility";
import { formatDriveSyncSummary, getDriveStatus, scanDriveTree, type DriveListedFile } from "@/lib/drive";
import { addInboxFile, extraDocuments, listInbox, updateInboxDrive, updateStoredDocumentDrive } from "@/lib/data/store";
import { documents } from "@/lib/data/seed";
import { driveResourceId } from "@/lib/http";
import { formatDate } from "@/lib/format";
import type { DriveDocument, InboxFile } from "@/lib/types";

export type DriveReviewItem = {
  id: string;
  name: string;
  folder: string;
  date: string;
  driveUrl: string | null;
};

export type DriveMissingItem = {
  driveId: string;
  name: string;
};

function cronOk(req: Request) {
  const url = new URL(req.url);
  const bearer = req.headers.get("authorization");
  return (
    Boolean(process.env.CRON_SECRET) &&
    (bearer === `Bearer ${process.env.CRON_SECRET}` ||
      url.searchParams.get("secret") === process.env.CRON_SECRET)
  );
}

async function authorized(req: Request, opts: { allowCron: boolean }) {
  if (opts.allowCron && cronOk(req)) return { via: "cron" as const };
  const user = await getSession();
  if (!user) return null;
  const mode = await getMode();
  if (!canSeeInbox(mode)) return null;
  return { via: "session" as const };
}

function reviewFromInbox(
  files: Awaited<ReturnType<typeof listInbox>>,
  folders: Map<string, string>,
): DriveReviewItem[] {
  return files
    .filter((f) => !f.classified && f.source === "drive")
    .map((f) => ({
      id: f.id,
      name: f.name,
      folder: (f.driveId && folders.get(f.driveId)) || "Drive",
      date: formatDate(f.receivedAt.slice(0, 10)),
      driveUrl: f.driveUrl,
    }));
}

function changedMeta(
  current: { name: string; driveUrl: string | null; driveModifiedAt?: string | null },
  file: DriveListedFile,
) {
  const nameChanged = current.name.trim() !== file.name.trim();
  const hadTime = Boolean(current.driveModifiedAt);
  const timeChanged = hadTime && current.driveModifiedAt !== file.modifiedAt;
  const hadLink = Boolean(driveResourceId(current.driveUrl));
  const linkArrived = !hadLink && Boolean(driveResourceId(file.webViewLink));
  return {
    nameChanged,
    timeChanged,
    linkArrived,
    material: nameChanged || timeChanged || linkArrived,
    baselineOnly: !nameChanged && !timeChanged && !linkArrived && !hadTime && Boolean(file.modifiedAt),
  };
}

async function runSync() {
  const inbox = await listInbox();
  const extras = await extraDocuments();
  const inboxByDrive = new Map<string, InboxFile>();
  const extraByDrive = new Map<string, DriveDocument>();
  const seedByDrive = new Map<string, DriveDocument>();
  for (const file of inbox) if (file.driveId) inboxByDrive.set(file.driveId, file);
  for (const doc of extras) if (doc.driveId) extraByDrive.set(doc.driveId, doc);
  for (const doc of documents) if (doc.driveId) seedByDrive.set(doc.driveId, doc);

  const listed = await scanDriveTree();
  const emptyReview: DriveReviewItem[] = [];
  const emptyMissing: DriveMissingItem[] = [];

  if (!listed.configured || !listed.ok) {
    return {
      configured: listed.configured,
      ok: false,
      message: listed.message,
      created: 0,
      updated: 0,
      foldersRead: listed.foldersRead,
      missing: emptyMissing,
      folderIssues: listed.folderIssues,
      seedDrift: [] as { driveId: string; name: string; driveName: string }[],
      files: emptyReview,
    };
  }

  let created = 0;
  let updated = 0;
  const added: DriveReviewItem[] = [];
  const seedDrift: { driveId: string; name: string; driveName: string }[] = [];
  const seen = new Set<string>();

  for (const file of listed.files) {
    seen.add(file.id);
    const inInbox = inboxByDrive.get(file.id);
    const inExtra = extraByDrive.get(file.id);
    const inSeed = seedByDrive.get(file.id);

    if (inInbox) {
      const diff = changedMeta(inInbox, file);
      if (diff.material || diff.baselineOnly) {
        try {
          const row = await updateInboxDrive(file.id, {
            name: diff.nameChanged ? file.name : undefined,
            driveUrl: diff.linkArrived ? file.webViewLink : undefined,
            driveModifiedAt: file.modifiedAt || null,
          });
          if (row && diff.material) updated += 1;
        } catch (err) {
          console.error("[drive/sync] inbox update", err);
        }
      }
      continue;
    }

    if (inExtra) {
      const diff = changedMeta({ name: inExtra.title, driveUrl: inExtra.driveUrl, driveModifiedAt: null }, file);
      if (diff.nameChanged || diff.linkArrived) {
        try {
          const hit = await updateStoredDocumentDrive(file.id, {
            title: diff.nameChanged ? file.name : undefined,
            driveUrl: diff.linkArrived ? file.webViewLink : undefined,
          });
          if (hit) updated += 1;
        } catch (err) {
          console.error("[drive/sync] document update", err);
        }
      }
      continue;
    }

    if (inSeed) {
      if (inSeed.title.trim() !== file.name.trim()) {
        seedDrift.push({ driveId: file.id, name: inSeed.title, driveName: file.name });
      }
      continue;
    }

    try {
      const row = await addInboxFile({
        name: file.name,
        driveUrl: file.webViewLink,
        driveId: file.id,
        driveModifiedAt: file.modifiedAt || null,
        source: "drive",
      });
      inboxByDrive.set(file.id, row);
      created += 1;
      added.push({
        id: row.id,
        name: row.name,
        folder: file.folder,
        date: formatDate(file.modifiedAt.slice(0, 10) || row.receivedAt.slice(0, 10)),
        driveUrl: row.driveUrl,
      });
    } catch (err) {
      console.error("[drive/sync] inbox insert", err);
    }
  }

  const missing: DriveMissingItem[] = [];
  if (!listed.truncated) {
    const read = new Set(listed.foldersOk);
    const incomplete = new Set(listed.incompleteFolders);
    const blocked = listed.folderIssues.length > 0;
    const known = new Map<string, { name: string; folderId: string | null }>();
    for (const [id, doc] of seedByDrive) known.set(id, { name: doc.title, folderId: doc.folderId });
    for (const [id, doc] of extraByDrive) {
      known.set(id, { name: doc.title, folderId: doc.folderId ?? known.get(id)?.folderId ?? null });
    }
    for (const [id, file] of inboxByDrive) {
      const prev = known.get(id);
      known.set(id, { name: file.name, folderId: prev?.folderId ?? null });
    }
    for (const [driveId, row] of known) {
      if (seen.has(driveId)) continue;
      if (row.folderId) {
        if (incomplete.has(row.folderId) || !read.has(row.folderId)) continue;
      } else if (blocked) {
        continue;
      }
      missing.push({ driveId, name: row.name });
    }
  }

  return {
    configured: true,
    ok: true,
    message: formatDriveSyncSummary({
      created,
      updated,
      foldersRead: listed.foldersRead,
      folderIssues: listed.folderIssues,
      missing: missing.length,
      truncated: listed.truncated,
    }),
    created,
    updated,
    foldersRead: listed.foldersRead,
    missing,
    folderIssues: listed.folderIssues,
    seedDrift,
    files: added,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const peek = url.searchParams.get("peek") === "1";
  const auth = await authorized(req, { allowCron: !peek });
  const localOk =
    !peek && process.env.NODE_ENV !== "production" && !process.env.CRON_SECRET;
  if (!auth && !localOk) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (peek) {
    if (!auth || auth.via !== "session") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const inbox = await listInbox();
    return NextResponse.json({
      configured: getDriveStatus().configured,
      ok: true,
      message: "",
      files: reviewFromInbox(inbox, new Map()),
    });
  }

  const result = await runSync();
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const auth = await authorized(req, { allowCron: false });
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await runSync();
  return NextResponse.json(result);
}
