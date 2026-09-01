/**
 * Login: Supabase Auth (SUPABASE_AUTH=1) ou HMAC + ELEVA_DEV_PASSWORD.
 * Sempre grava ct-session, sempre no modo Operar. Sem signup.
 * Service role não entra aqui. Sem SESSION_SECRET não emite cookie nenhum.
 */
import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, authenticate, encodeSessionToken, isElevaEmail } from "@/lib/auth";
import { isSupabaseAuthEnabled, wantsSupabaseAuth } from "@/lib/config";
import { cookieSecure, safeInternalPath } from "@/lib/http";
import { DEFAULT_MEETING } from "@/lib/meeting";
import { LEGACY_MODE_COOKIE } from "@/lib/mode";
import { hasSessionSecret } from "@/lib/secret";
import { SEEN_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  const next = safeInternalPath(String(form.get("next") || "/"));
  const origin = new URL(req.url).origin;

  if (!hasSessionSecret()) {
    console.error("[auth] SESSION_SECRET ausente — login recusado");
    return NextResponse.redirect(`${origin}/login?error=config`, { status: 303 });
  }

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
    maxAge: SESSION_MAX_AGE,
  };
  res.cookies.set(SESSION_COOKIE, await encodeSessionToken(user, DEFAULT_MEETING), cookie);
  res.cookies.set(SEEN_COOKIE, String(Date.now()), { ...cookie, httpOnly: false });
  res.cookies.set(LEGACY_MODE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
