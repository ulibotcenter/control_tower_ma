import { NextResponse } from "next/server";
import { cleanText } from "@/lib/data/room-input";
import { isRhCardField, loopertPersonNames } from "@/lib/data/rh-deck";
import { saveRhCardEdit } from "@/lib/data/store";
import { denyUnlessOperate } from "@/lib/room-write";

export async function POST(req: Request) {
  const denied = await denyUnlessOperate();
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as {
    personName?: string;
    field?: string;
    value?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "fields" }, { status: 400 });

  const personName = cleanText(body.personName, 120);
  const field = typeof body.field === "string" ? body.field : "";
  const value = cleanText(body.value, 240) || "—";
  if (!personName || !isRhCardField(field) || !loopertPersonNames().includes(personName)) {
    return NextResponse.json({ error: "fields" }, { status: 400 });
  }

  try {
    const edit = await saveRhCardEdit({ personName, field, value });
    return NextResponse.json({ edit });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao gravar a ficha";
    console.error("[api/rh]", message);
    return NextResponse.json({ error: "store", message }, { status: 500 });
  }
}
