import { NextResponse } from "next/server";
import { parseActionStatus } from "@/lib/data/room-input";
import { updateAction } from "@/lib/data/store";
import { denyUnlessOperate } from "@/lib/room-write";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await denyUnlessOperate();
  if (denied) return denied;

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = parseActionStatus(body?.status);
  if (!status) return NextResponse.json({ error: "fields" }, { status: 400 });

  try {
    const action = await updateAction(id, status);
    if (!action) return NextResponse.json({ error: "missing" }, { status: 404 });
    return NextResponse.json({ action });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao atualizar a tarefa";
    console.error("[api/actions]", message);
    return NextResponse.json({ error: "store", message }, { status: 500 });
  }
}
