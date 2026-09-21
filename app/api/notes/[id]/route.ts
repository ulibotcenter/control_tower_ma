import { NextResponse } from "next/server";
import { cleanText, isUuid, parseVisibility } from "@/lib/data/room-input";
import { deleteNote, updateNote } from "@/lib/data/store";
import { denyUnlessOperate } from "@/lib/room-write";
import type { Note } from "@/lib/types";

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

  const body = (await req.json().catch(() => null)) as { body?: string; visibility?: string } | null;
  if (!body) return NextResponse.json({ error: "fields" }, { status: 400 });

  const patch: Partial<Pick<Note, "body" | "visibility">> = {};
  if ("body" in body) {
    const text = cleanText(body.body, 4000);
    if (!text) return NextResponse.json({ error: "fields" }, { status: 400 });
    patch.body = text;
  }
  if ("visibility" in body) {
    const visibility = parseVisibility(body.visibility);
    if (!visibility) return NextResponse.json({ error: "fields" }, { status: 400 });
    patch.visibility = visibility;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "fields" }, { status: 400 });

  try {
    const note = await updateNote(id, patch);
    if (!note) return NextResponse.json({ error: "missing" }, { status: 404 });
    return NextResponse.json({ note });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao atualizar a nota";
    console.error("[api/notes]", message);
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
    const ok = await deleteNote(id);
    if (!ok) return NextResponse.json({ error: "missing" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao excluir a nota";
    console.error("[api/notes]", message);
    return NextResponse.json({ error: "store", message }, { status: 500 });
  }
}
