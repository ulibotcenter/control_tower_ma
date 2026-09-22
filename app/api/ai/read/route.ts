import { NextResponse } from "next/server";
import { readDealProposals } from "@/lib/ai/read";
import { getDealBySlug, getDealSlugs } from "@/lib/data/provider";
import { denyUnlessOperate } from "@/lib/room-write";
import { AI_UNCONFIGURED } from "@/lib/ai/env";

export const runtime = "nodejs";
/** A, até quatro chamadas de B e C, cada uma com uma retentativa sem json_object. */
export const maxDuration = 800;

export async function POST(req: Request) {
  const denied = await denyUnlessOperate();
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as { dealSlug?: string } | null;
  const slug = typeof body?.dealSlug === "string" ? body.dealSlug.trim() : "";
  if (!slug || !getDealBySlug(slug) || !getDealSlugs().includes(slug)) {
    return NextResponse.json({ error: "fields" }, { status: 400 });
  }

  try {
    const result = await readDealProposals(slug);
    if (!result.configured) {
      return NextResponse.json({
        configured: false,
        message: result.message || AI_UNCONFIGURED,
        proposals: [],
      });
    }
    if (result.message === "Deal desconhecido.") {
      return NextResponse.json({ configured: true, message: result.message, proposals: [] }, { status: 404 });
    }
    if (result.failed) {
      return NextResponse.json(
        {
          configured: true,
          failed: true,
          message: result.message,
          toast: result.toast,
          waves: result.waves,
          proposals: result.proposals,
        },
        { status: 502 },
      );
    }
    return NextResponse.json({
      configured: true,
      message: result.toast,
      toast: result.toast,
      waves: result.waves,
      proposals: result.proposals,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao gravar a fila";
    console.error("[api/ai/read]", message);
    return NextResponse.json({ configured: true, error: "store", message, proposals: [] }, { status: 500 });
  }
}
