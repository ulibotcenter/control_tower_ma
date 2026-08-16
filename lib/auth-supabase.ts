/**
 * Login individual — só anon key + signInWithPassword.
 * Sem signup. Sem service role. Quem não existe no Auth não entra.
 *
 * Ligar: SUPABASE_AUTH=1 + NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Depois do sign-in a torre grava ct-session (HMAC). O restante não muda.
 */
import { createClient } from "@supabase/supabase-js";
import { hasSupabaseAnon, supabaseUrl } from "./config";
import { displayName } from "./format";
import type { SessionUser } from "./types";

export async function verifyWithSupabase(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const url = supabaseUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
  if (!hasSupabaseAnon() || !url || !anon) {
    console.error("[auth] SUPABASE_AUTH ligado, mas URL/ANON_KEY ausentes");
    return null;
  }

  const sb = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user?.email) {
    if (error) console.info("[auth] signIn recusado", error.message);
    return null;
  }

  const normalized = data.user.email.toLowerCase();
  return { email: normalized, name: displayName(normalized) };
}
