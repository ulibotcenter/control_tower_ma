import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMode } from "@/lib/mode";
import { canSeeInbox } from "@/lib/visibility";
import { dismissInboxFiles } from "@/lib/data/store";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const mode = await getMode();
  if (!canSeeInbox(mode)) return NextResponse.json({ error: "hidden" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id): id is string => typeof id === "string") : [];
  if (!ids.length) return NextResponse.json({ count: 0 });

  try {
    const count = await dismissInboxFiles(ids);
    return NextResponse.json({ count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao dispensar";
    console.error("[api/inbox/dismiss]", message);
    return NextResponse.json({ error: "store", message }, { status: 500 });
  }
}
