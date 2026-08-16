/**
 * Sessão da torre: cookie HMAC `ct-session`.
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
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ALLOWED_EMAIL_DOMAIN } from "./constants";
import { allowDevLogin, isSupabaseAuthEnabled } from "./config";
import { verifyWithSupabase } from "./auth-supabase";
import { displayName } from "./format";
import type { SessionUser } from "./types";

export const SESSION_COOKIE = "ct-session";
const MAX_AGE = 60 * 60 * 12;

function secret() {
  return process.env.SESSION_SECRET || process.env.ELEVA_DEV_PASSWORD || "dev-only-not-for-prod";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function isElevaEmail(email: string) {
  const e = email.trim().toLowerCase();
  return e.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

export function encodeSession(user: SessionUser) {
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({ ...user, iat: now, exp: now + MAX_AGE * 1000 }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser & {
      exp?: number;
    };
    if (!data.email || (data.exp && data.exp < Date.now())) return null;
    return { email: data.email, name: data.name || displayName(data.email) };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return decodeSession(jar.get(SESSION_COOKIE)?.value);
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
