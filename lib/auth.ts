/**
 * Sessão da torre: cookie HMAC `ct-session` (ver lib/session-token.ts).
 *
 * A chave é SESSION_SECRET e não tem fallback: sem ela nada é assinado nem
 * verificado, e a torre recusa autenticar em vez de usar uma chave conhecida.
 *
 * Dois caminhos de login (lib/config.ts):
 *   SUPABASE_AUTH=1 + URL + ANON_KEY
 *     → signInWithPassword. Quem não tem conta no Auth não entra.
 *     Service role não é usado.
 *   senão
 *     → senha única ELEVA_DEV_PASSWORD (ou qualquer senha em dev local)
 *       e só e-mail @elevaprojects.com.
 *
 * Depois do sucesso sempre grava ct-session. getSession() só lê o cookie.
 */
import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ALLOWED_EMAIL_DOMAIN } from "./constants";
import { allowDevLogin, isSupabaseAuthEnabled } from "./config";
import { verifyWithSupabase } from "./auth-supabase";
import { displayName } from "./format";
import { hasSessionSecret } from "./secret";
import { decodeSessionToken, SESSION_COOKIE, type SessionPayload } from "./session-token";
import type { SessionUser } from "./types";

export { SESSION_COOKIE, SESSION_MAX_AGE, encodeSessionToken } from "./session-token";
export type { SessionPayload } from "./session-token";

export function isElevaEmail(email: string) {
  const e = email.trim().toLowerCase();
  return e.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

/** Sessão completa: quem entrou + estado da reunião. */
export async function getSessionPayload(): Promise<SessionPayload | null> {
  if (!hasSessionSecret()) return null;
  const jar = await cookies();
  return decodeSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function getSession(): Promise<SessionUser | null> {
  return (await getSessionPayload())?.user ?? null;
}

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) return null;

  if (isSupabaseAuthEnabled()) {
    return verifyWithSupabase(normalized, password);
  }

  if (!isElevaEmail(normalized)) return null;

  const expected = process.env.ELEVA_DEV_PASSWORD;
  if (expected) {
    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } else if (!allowDevLogin()) {
    return null;
  }

  return { email: normalized, name: displayName(normalized) };
}
