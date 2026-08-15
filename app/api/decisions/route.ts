import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMode } from "@/lib/mode";
import { canRegisterDecision, canSeeDecisions } from "@/lib/visibility";
import { addDecision, listDecisions } from "@/lib/data/store";
import type { DecisionWho } from "@/lib/types";
import { WHO_LABEL } from "@/lib/constants";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (canSeeDecisions(await getMode()) === "hidden") {
    return NextResponse.json({ error: "hidden" }, { status: 403 });
  }
  return NextResponse.json({ decisions: await listDecisions() });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canRegisterDecision(await getMode())) {
    return NextResponse.json({ error: "hidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    dealId?: string | null;
    who?: DecisionWho;
    whoLabel?: string;
    date?: string;
    elevaRecommendation?: string;
    decisionTaken?: string;
    againstRecommendation?: boolean;
    consequence?: string;
  };

  const who = body.who;
  const knownWho = who === "board" || who === "eleva" || who === "pacta";
  if (!knownWho || !body.date || !body.elevaRecommendation || !body.decisionTaken || !body.consequence) {
    return NextResponse.json({ error: "fields" }, { status: 400 });
  }

  try {
    const row = await addDecision({
      dealId: body.dealId || null,
      who,
      whoLabel: body.whoLabel?.trim() || WHO_LABEL[who],
      date: body.date,
      elevaRecommendation: body.elevaRecommendation,
      decisionTaken: body.decisionTaken,
      againstRecommendation: Boolean(body.againstRecommendation),
      consequence: body.consequence,
    });
    return NextResponse.json({ decision: row });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao gravar decisão";
    console.error("[api/decisions]", message);
    return NextResponse.json({ error: "store", message }, { status: 500 });
  }
}
