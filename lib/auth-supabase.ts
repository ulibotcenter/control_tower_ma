/**
 * Adaptador Supabase Auth — pronto, desligado por padrão.
 *
 * Ligar com SUPABASE_AUTH=1 + NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Continua Eleva-only: e-mail fora de @elevaprojects.com é recusado.
 *
 * Depois do sign-in, a torre ainda grava o cookie HMAC (ct-session).
 * Quando o Auth SSR entrar de vez, trocar getSession() neste mesmo ponto.
 */
import { createClient } from "@supabase/supabase-js";
import { ALLOWED_EMAIL_DOMAIN } from "./constants";
import { hasSupabaseAnon, supabaseUrl } from "./config";
import { displayName } from "./format";
import type { SessionUser } from "./types";

export async function verifyWithSupabase(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const url = supabaseUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
  if (!hasSupabaseAnon() || !url || !anon) return null;

  const sb = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user?.email) return null;

  const normalized = data.user.email.toLowerCase();
  if (!normalized.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    await sb.auth.signOut();
    return null;
  }

  return { email: normalized, name: displayName(normalized) };
}
