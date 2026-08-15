/**
 * Login Eleva-only.
 * authenticate() usa senha local/HMAC hoje, ou Supabase Auth se SUPABASE_AUTH=1.
 * Em ambos os casos grava ct-session — o restante da torre não muda.
 */
import { NextResponse } from "next/server";
import { SESSION_COOKIE, authenticate, encodeSession, isElevaEmail } from "@/lib/auth";
import { cookieSecure, safeInternalPath } from "@/lib/http";
import { SEEN_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  const next = safeInternalPath(String(form.get("next") || "/"));

  const origin = new URL(req.url).origin;
  if (!isElevaEmail(email)) {
    return NextResponse.redirect(`${origin}/login?error=domain&next=${encodeURIComponent(next)}`, {
      status: 303,
    });
  }

  const user = await authenticate(email, password);
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth&next=${encodeURIComponent(next)}`, {
      status: 303,
    });
  }

  const res = NextResponse.redirect(new URL(next, origin), { status: 303 });
  const secure = cookieSecure(req);
  res.cookies.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  res.cookies.set(SEEN_COOKIE, String(Date.now()), {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
