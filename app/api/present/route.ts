import { NextResponse } from "next/server";
import { cookieSecure } from "@/lib/http";
import { getSession } from "@/lib/auth";
import { PRESENT_COOKIE } from "@/lib/present";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json()) as { on?: boolean };
  const on = Boolean(body.on);
  const res = NextResponse.json({ ok: true, present: on });
  res.cookies.set(PRESENT_COOKIE, on ? "1" : "0", {
    httpOnly: false,
    sameSite: "lax",
    secure: cookieSecure(req),
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
