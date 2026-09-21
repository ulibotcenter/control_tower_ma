import { NextResponse } from "next/server";
import { getDealBySlug } from "@/lib/data/provider";
import { cleanText, parseOpenPointStatus, parsePillar, parseVisibility } from "@/lib/data/room-input";
import { addOpenPoint } from "@/lib/data/store";
import { denyUnlessOperate } from "@/lib/room-write";

export async function POST(req: Request) {
  const denied = await denyUnlessOperate();
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as {
    dealSlug?: string;
    title?: string;
    owner?: string;
    due?: string;
    pillarSlug?: string | null;
    status?: string;
    visibility?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "fields" }, { status: 400 });

  const deal = getDealBySlug(String(body.dealSlug ?? ""));
  const title = cleanText(body.title, 280);
  const pillarSlug = parsePillar(body.pillarSlug);
  const visibility = body.visibility == null || body.visibility === "" ? "advisors" : parseVisibility(body.visibility);
  const status = body.status == null || body.status === "" ? "aberto" : parseOpenPointStatus(body.status);
  if (!deal || !title || pillarSlug === undefined || !visibility || !status) {
    return NextResponse.json({ error: "fields" }, { status: 400 });
  }

  try {
    const point = await addOpenPoint({
      dealId: deal.id,
      slug: deal.slug,
      title,
      owner: cleanText(body.owner, 120),
      due: cleanText(body.due, 80),
      pillarSlug,
      status,
      visibility,
      sensitivities: [],
    });
    return NextResponse.json({ point });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao gravar o ponto";
    console.error("[api/open-points]", message);
    return NextResponse.json({ error: "store", message }, { status: 500 });
  }
}
