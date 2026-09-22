import { NextResponse } from "next/server";
import { setAiProposalStatus } from "@/lib/data/store";
import { denyUnlessOperate } from "@/lib/room-write";
import type { AiProposalStatus } from "@/lib/types";

const NEXT: AiProposalStatus[] = ["aceita", "descartada", "editada"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await denyUnlessOperate();
  if (denied) return denied;

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = body?.status;
  if (!status || !(NEXT as string[]).includes(status)) {
    return NextResponse.json({ error: "fields" }, { status: 400 });
  }

  try {
    const proposal = await setAiProposalStatus(id, status as AiProposalStatus);
    if (!proposal) return NextResponse.json({ error: "missing" }, { status: 404 });
    return NextResponse.json({ proposal });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao atualizar a proposta";
    console.error("[api/ai/proposals]", message);
    return NextResponse.json({ error: "store", message }, { status: 500 });
  }
}
