import { NextResponse } from "next/server";
import { buildInboxPayload, dispatchAlert } from "@/lib/alerts";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json()) as { name?: string };
  const payload = await buildInboxPayload(body.name || "arquivo");
  const result = await dispatchAlert(payload);
  return NextResponse.json({ payload, result });
}
