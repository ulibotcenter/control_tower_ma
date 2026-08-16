/**
 * Login: Supabase Auth (SUPABASE_AUTH=1) ou HMAC + ELEVA_DEV_PASSWORD.
 * Sempre grava ct-session. Sem signup. Service role não entra aqui.
 */
import { NextResponse } from "next/server";
import { SESSION_COOKIE, authenticate, encodeSession, isElevaEmail } from "@/lib/auth";
import { isSupabaseAuthEnabled, wantsSupabaseAuth } from "@/lib/config";
import { cookieSecure, safeInternalPath } from "@/lib/http";
import { SEEN_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  const next = safeInternalPath(String(form.get("next") || "/"));
  const origin = new URL(req.url).origin;

  if (wantsSupabaseAuth() && !isSupabaseAuthEnabled()) {
    console.error("[auth] SUPABASE_AUTH ligado sem URL/ANON_KEY");
    return NextResponse.redirect(`${origin}/login?error=denied&next=${encodeURIComponent(next)}`, {
      status: 303,
    });
  }

  if (!isSupabaseAuthEnabled() && !isElevaEmail(email)) {
    return NextResponse.redirect(`${origin}/login?error=denied&next=${encodeURIComponent(next)}`, {
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
  const cookie = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 60 * 60 * 12,
  };
  res.cookies.set(SESSION_COOKIE, encodeSession(user), cookie);
  res.cookies.set(SEEN_COOKIE, String(Date.now()), { ...cookie, httpOnly: false });
  return res;
}
