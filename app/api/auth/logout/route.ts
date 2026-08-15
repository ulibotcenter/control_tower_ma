import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { cookieSecure } from "@/lib/http";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(req),
    path: "/",
    maxAge: 0,
  });
  return res;
}
