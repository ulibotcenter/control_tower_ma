/**
 * Cookie de sessão `ct-session`: payload base64url + HMAC.
 *
 * Carrega quem entrou e o estado da reunião (modo + deal travado). Manter os
 * dois no mesmo cookie assinado é o que impede trocar de modo pelo devtools:
 * o cookie é httpOnly, e apagá-lo desloga em vez de cair em Operar.
 *
 * Sem next/headers e sem Supabase aqui — o middleware importa este arquivo.
 */
import { decodeBase64Url, encodeBase64Url, signPayload, verifyPayload } from "./secret";
import { DEFAULT_MEETING, normalizeMeeting, type MeetingState } from "./meeting";
import type { SessionUser } from "./types";

export const SESSION_COOKIE = "ct-session";
export const SESSION_MAX_AGE = 60 * 60 * 12;

export type SessionPayload = {
  user: SessionUser;
  meeting: MeetingState;
  /** Fim da sessão absoluta, em ms. Não é renovado ao trocar de modo. */
  expiresAt: number;
};

type CookieBody = {
  email?: string;
  name?: string;
  mode?: string;
  targetDeal?: string | null;
  iat?: number;
  exp?: number;
};

export async function encodeSessionToken(
  user: SessionUser,
  meeting: MeetingState = DEFAULT_MEETING,
  expiresAt?: number,
): Promise<string> {
  const now = Date.now();
  const body: CookieBody = {
    email: user.email,
    name: user.name,
    mode: meeting.mode,
    targetDeal: meeting.targetDeal,
    iat: now,
    exp: expiresAt ?? now + SESSION_MAX_AGE * 1000,
  };
  const payload = encodeBase64Url(JSON.stringify(body));
  return `${payload}.${await signPayload(payload)}`;
}

export async function decodeSessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!(await verifyPayload(payload, signature))) return null;

  let body: CookieBody;
  try {
    body = JSON.parse(decodeBase64Url(payload)) as CookieBody;
  } catch {
    return null;
  }

  if (!body.email) return null;
  const expiresAt = typeof body.exp === "number" ? body.exp : 0;
  if (!expiresAt || expiresAt < Date.now()) return null;

  return {
    user: { email: body.email, name: body.name || body.email },
    meeting: normalizeMeeting({ mode: body.mode, targetDeal: body.targetDeal }),
    expiresAt,
  };
}

/** Segundos restantes da sessão absoluta — usado ao reemitir o cookie. */
export function remainingMaxAge(expiresAt: number) {
  return Math.max(1, Math.floor((expiresAt - Date.now()) / 1000));
}
