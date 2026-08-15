import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMode } from "@/lib/mode";
import { canSeeInbox } from "@/lib/visibility";
import { addInboxFile, listInbox } from "@/lib/data/store";
import { buildInboxPayload, dispatchAlert } from "@/lib/alerts";
import { sanitizeDriveUrl } from "@/lib/http";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const mode = await getMode();
  if (!canSeeInbox(mode)) return NextResponse.json({ error: "hidden" }, { status: 403 });
  return NextResponse.json({ files: await listInbox() });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const mode = await getMode();
  if (!canSeeInbox(mode)) return NextResponse.json({ error: "hidden" }, { status: 403 });

  const body = (await req.json()) as { name?: string; driveUrl?: string };
  if (!body.name?.trim()) return NextResponse.json({ error: "name" }, { status: 400 });
  if (body.driveUrl?.trim() && !sanitizeDriveUrl(body.driveUrl)) {
    return NextResponse.json({ error: "drive_url" }, { status: 400 });
  }

  try {
    const file = await addInboxFile({
      name: body.name,
      driveUrl: body.driveUrl || null,
      source: "manual",
    });
    await dispatchAlert(await buildInboxPayload(file.name));
    return NextResponse.json({ file });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "store" }, { status: 500 });
  }
}
