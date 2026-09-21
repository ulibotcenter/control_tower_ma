import { NextResponse } from "next/server";
import { cleanText, parseOpenPointStatus, parsePillar, parseVisibility } from "@/lib/data/room-input";
import { updateOpenPoint } from "@/lib/data/store";
import { denyUnlessOperate } from "@/lib/room-write";
import type { OpenPoint } from "@/lib/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await denyUnlessOperate();
  if (denied) return denied;

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    title?: string;
    owner?: string;
    due?: string;
    pillarSlug?: string | null;
    status?: string;
    visibility?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "fields" }, { status: 400 });

  const patch: Partial<Pick<OpenPoint, "title" | "owner" | "due" | "pillarSlug" | "status" | "visibility">> = {};
  if ("title" in body) {
    const title = cleanText(body.title, 280);
    if (!title) return NextResponse.json({ error: "fields" }, { status: 400 });
    patch.title = title;
  }
  if ("owner" in body) patch.owner = cleanText(body.owner, 120);
  if ("due" in body) patch.due = cleanText(body.due, 80);
  if ("pillarSlug" in body) {
    const pillarSlug = parsePillar(body.pillarSlug);
    if (pillarSlug === undefined) return NextResponse.json({ error: "fields" }, { status: 400 });
    patch.pillarSlug = pillarSlug;
  }
  if ("status" in body) {
    const status = parseOpenPointStatus(body.status);
    if (!status) return NextResponse.json({ error: "fields" }, { status: 400 });
    patch.status = status;
  }
  if ("visibility" in body) {
    const visibility = parseVisibility(body.visibility);
    if (!visibility) return NextResponse.json({ error: "fields" }, { status: 400 });
    patch.visibility = visibility;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "fields" }, { status: 400 });

  try {
    const point = await updateOpenPoint(id, patch);
    if (!point) return NextResponse.json({ error: "missing" }, { status: 404 });
    return NextResponse.json({ point });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao atualizar o ponto";
    console.error("[api/open-points]", message);
    return NextResponse.json({ error: "store", message }, { status: 500 });
  }
}
