import { NextResponse } from "next/server";
import { MODE_COOKIE, parseMode } from "@/lib/mode";
import { cookieSecure } from "@/lib/http";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json()) as { mode?: string };
  const mode = parseMode(body.mode);
  const res = NextResponse.json({ ok: true, mode });
  res.cookies.set(MODE_COOKIE, mode, {
    httpOnly: false,
    sameSite: "lax",
    secure: cookieSecure(req),
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
