import type { MeetingMode } from "./types";

const ALL = [
  { keys: "1", action: "Abrir Loopert" },
  { keys: "2", action: "Abrir Radio Health" },
  { keys: "P", action: "Ligar ou sair da apresentação" },
  { keys: "/", action: "Focar a busca" },
  { keys: "?", action: "Ver estes atalhos" },
] as const;

export const SHORTCUTS = ALL;

/**
 * No modo Alvo os atalhos que trocam de tela ficam desligados: uma tecla solta
 * durante a reunião não pode levar o alvo para a outra operação nem mexer no
 * que está projetado. Sair do Alvo só pelo seletor de modo, com confirmação.
 */
export function shortcutsFor(mode: MeetingMode): readonly { keys: string; action: string }[] {
  return mode === "target" ? ALL.filter((s) => s.keys === "?") : ALL;
}

export function keyboardNavEnabled(mode: MeetingMode) {
  return mode !== "target";
}

export function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(el.closest("[role='dialog']"));
}
