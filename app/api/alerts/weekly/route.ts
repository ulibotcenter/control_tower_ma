import { NextResponse } from "next/server";
import { buildWeeklyPayload, dispatchAlert } from "@/lib/alerts";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bearer = req.headers.get("authorization");
  const cronOk =
    Boolean(process.env.CRON_SECRET) &&
    (bearer === `Bearer ${process.env.CRON_SECRET}` ||
      url.searchParams.get("secret") === process.env.CRON_SECRET);
  const session = await getSession();
  const localOk = process.env.NODE_ENV !== "production" && !process.env.CRON_SECRET;
  if (!cronOk && !session && !localOk) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await buildWeeklyPayload();
  const result = await dispatchAlert(payload);
  return NextResponse.json({ payload, result });
}
