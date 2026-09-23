import { NextResponse } from "next/server";
import { ingestDataRoom } from "@/lib/ingest-data-room";
import { denyUnlessOperate } from "@/lib/room-write";

export const runtime = "nodejs";
/** Hobby: o teto da função é 300. Este caminho não chama OpenRouter. */
export const maxDuration = 300;

export async function POST() {
  const denied = await denyUnlessOperate();
  if (denied) return denied;
  try {
    const result = await ingestDataRoom();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha";
    console.error("[doc_text]", message);
    return NextResponse.json(
      {
        configured: true,
        ok: false,
        toast: message,
        ingested: 0,
        memory: 0,
        eligible: 0,
        failed: 0,
      },
      { status: 500 },
    );
  }
}
