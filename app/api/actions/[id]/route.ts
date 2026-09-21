import { NextResponse } from "next/server";
import { cleanText, isUuid, parseActionStatus, parsePillar, parseVisibility } from "@/lib/data/room-input";
import { deleteAction, updateAction } from "@/lib/data/store";
import { denyUnlessOperate } from "@/lib/room-write";
import type { ActionItem } from "@/lib/types";

function rejectSeed(id: string) {
  if (isUuid(id)) return null;
  return NextResponse.json({ error: "seed" }, { status: 400 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await denyUnlessOperate();
  if (denied) return denied;

  const { id } = await params;
  const seeded = rejectSeed(id);
  if (seeded) return seeded;

  const body = (await req.json().catch(() => null)) as {
    title?: string;
    owner?: string;
    due?: string;
    pillarSlug?: string | null;
    status?: string;
    visibility?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "fields" }, { status: 400 });

  const patch: Partial<Pick<ActionItem, "title" | "owner" | "due" | "pillarSlug" | "status" | "visibility">> = {};
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
    const status = parseActionStatus(body.status);
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
    const action = await updateAction(id, patch);
    if (!action) return NextResponse.json({ error: "missing" }, { status: 404 });
    return NextResponse.json({ action });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao atualizar a tarefa";
    console.error("[api/actions]", message);
    return NextResponse.json({ error: "store", message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await denyUnlessOperate();
  if (denied) return denied;

  const { id } = await params;
  const seeded = rejectSeed(id);
  if (seeded) return seeded;

  try {
    const ok = await deleteAction(id);
    if (!ok) return NextResponse.json({ error: "missing" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao excluir a tarefa";
    console.error("[api/actions]", message);
    return NextResponse.json({ error: "store", message }, { status: 500 });
  }
}
