/**
 * Estado da reunião: qual modo está ligado e, no modo Alvo, qual operação
 * está na sala.
 *
 * Este estado viaja dentro do cookie de sessão (httpOnly + HMAC), não num
 * cookie próprio legível pelo browser. Consequência desejada: apagar ou
 * adulterar o cookie derruba a sessão inteira em vez de voltar para Operar.
 *
 * Só tipos e funções puras aqui — o middleware (Edge) importa este arquivo.
 */
import type { MeetingMode } from "./types";

export type MeetingState = {
  mode: MeetingMode;
  /** Slug do deal travado na reunião. Só existe no modo Alvo. */
  targetDeal: string | null;
};

export const DEFAULT_MEETING: MeetingState = { mode: "operate", targetDeal: null };

/** Digitada por extenso para sair do modo Alvo. Verificada no servidor. */
export const TARGET_EXIT_PHRASE = "SAIR DO ALVO";

export function parseMode(value: string | undefined | null): MeetingMode {
  if (value === "advisors" || value === "target" || value === "operate") return value;
  return "operate";
}

export function parseDealSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,60}$/.test(slug) ? slug : null;
}

export function normalizeMeeting(input: {
  mode?: unknown;
  targetDeal?: unknown;
}): MeetingState {
  const mode = parseMode(typeof input.mode === "string" ? input.mode : null);
  if (mode !== "target") return { mode, targetDeal: null };
  return { mode, targetDeal: parseDealSlug(input.targetDeal) };
}

export function matchesExitPhrase(raw: unknown): boolean {
  return typeof raw === "string" && raw.trim().toUpperCase() === TARGET_EXIT_PHRASE;
}

/** No modo Alvo com deal travado, só aquele deal responde. */
export function isDealAllowed(meeting: MeetingState, slug: string): boolean {
  if (meeting.mode !== "target" || !meeting.targetDeal) return true;
  return slug === meeting.targetDeal;
}

/** Slug único permitido, ou null quando todos estão liberados. */
export function lockedDeal(meeting: MeetingState): string | null {
  return meeting.mode === "target" ? meeting.targetDeal : null;
}

export function isDealPath(pathname: string, slug: string): boolean {
  return pathname === `/deals/${slug}` || pathname.startsWith(`/deals/${slug}/`);
}
