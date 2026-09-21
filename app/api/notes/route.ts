import { NextResponse } from "next/server";
import { getDealBySlug } from "@/lib/data/provider";
import { cleanText, parseVisibility } from "@/lib/data/room-input";
import { addNote } from "@/lib/data/store";
import { denyUnlessOperate } from "@/lib/room-write";

export async function POST(req: Request) {
  const denied = await denyUnlessOperate();
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as {
    dealSlug?: string;
    body?: string;
    visibility?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "fields" }, { status: 400 });

  const deal = getDealBySlug(String(body.dealSlug ?? ""));
  const text = cleanText(body.body, 4000);
  const visibility = body.visibility == null || body.visibility === "" ? "operate" : parseVisibility(body.visibility);
  if (!deal || !text || !visibility) return NextResponse.json({ error: "fields" }, { status: 400 });

  try {
    const note = await addNote({
      dealId: deal.id,
      slug: deal.slug,
      body: text,
      visibility,
      sensitivities: [],
    });
    return NextResponse.json({ note });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao gravar a nota";
    console.error("[api/notes]", message);
    return NextResponse.json({ error: "store", message }, { status: 500 });
  }
}
