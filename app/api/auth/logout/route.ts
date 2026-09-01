import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { cookieSecure } from "@/lib/http";
import { LEGACY_MODE_COOKIE } from "@/lib/mode";
import { PRESENT_COOKIE } from "@/lib/present";
import { SEEN_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const idle = new URL(req.url).searchParams.get("idle") === "1";
  const res = NextResponse.redirect(new URL(idle ? "/login?idle=1" : "/login?left=1", req.url), {
    status: 303,
  });
  const secure = cookieSecure(req);
  const gone = { httpOnly: true, sameSite: "lax" as const, secure, path: "/", maxAge: 0 };
  res.cookies.set(SESSION_COOKIE, "", gone);
  res.cookies.set(LEGACY_MODE_COOKIE, "", { ...gone, httpOnly: false });
  res.cookies.set(PRESENT_COOKIE, "", { ...gone, httpOnly: false });
  res.cookies.set(SEEN_COOKIE, "", { ...gone, httpOnly: false });
  return res;
}
