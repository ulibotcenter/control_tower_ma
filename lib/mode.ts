/**
 * Leitura do modo de reunião no servidor.
 *
 * O modo mora dentro do cookie de sessão assinado (lib/session-token.ts),
 * não mais num `ct-mode` legível e editável pelo browser. Sem sessão válida
 * não há modo: quem não está logado não escolhe o que aparece na tela.
 */
import { getSessionPayload } from "./auth";
import { DEFAULT_MEETING, lockedDeal, type MeetingState } from "./meeting";
import type { MeetingMode } from "./types";

/** Cookie antigo. Mantido só para ser apagado no login e no logout. */
export const LEGACY_MODE_COOKIE = "ct-mode";

export { parseMode } from "./meeting";

export async function getMeeting(): Promise<MeetingState> {
  return (await getSessionPayload())?.meeting ?? DEFAULT_MEETING;
}

export async function getMode(): Promise<MeetingMode> {
  return (await getMeeting()).mode;
}

/** Slug do deal travado na reunião, ou null quando todos estão liberados. */
export async function getLockedDeal(): Promise<string | null> {
  return lockedDeal(await getMeeting());
}
