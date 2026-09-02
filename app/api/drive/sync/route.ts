import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMode } from "@/lib/mode";
import { canSeeInbox } from "@/lib/visibility";
import { getDriveStatus, listNewDriveFiles } from "@/lib/drive";
import { addInboxFile, extraDocuments, listInbox } from "@/lib/data/store";
import { documents } from "@/lib/data/seed";
import { CORTE } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export type DriveReviewItem = {
  id: string;
  name: string;
  folder: string;
  date: string;
  driveUrl: string | null;
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

function corteIso() {
  const m = CORTE.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "2026-09-02T00:00:00.000Z";
  return `${m[3]}-${m[2]}-${m[1]}T00:00:00.000Z`;
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

async function runSync() {
  const inbox = await listInbox();
  const extras = await extraDocuments();
  const known = new Set<string>();
  for (const f of inbox) if (f.driveId) known.add(f.driveId);
  for (const d of documents) if (d.driveId) known.add(d.driveId);
  for (const d of extras) if (d.driveId) known.add(d.driveId);

  let since = corteIso();
  for (const f of inbox) {
    if (f.source !== "drive") continue;
    if (f.receivedAt > since) since = f.receivedAt;
  }

  const listed = await listNewDriveFiles({ knownIds: known, since });

  if (!listed.configured) {
    return {
      configured: false,
      ok: false,
      message: listed.message,
      files: [] as DriveReviewItem[],
    };
  }

  const added: DriveReviewItem[] = [];
  const folderByDriveId = new Map<string, string>();
  for (const file of listed.files) {
    if (known.has(file.id)) continue;
    try {
      const row = await addInboxFile({
        name: file.name,
        driveUrl: file.webViewLink,
        driveId: file.id,
        source: "drive",
      });
      known.add(file.id);
      folderByDriveId.set(file.id, file.folder);
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

  return {
    configured: true,
    ok: listed.ok,
    message:
      added.length === 0
        ? listed.ok
          ? "Nada novo no Drive"
          : listed.message
        : listed.message,
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
