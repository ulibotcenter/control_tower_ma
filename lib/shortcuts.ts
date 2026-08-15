export const SHORTCUTS = [
  { keys: "1", action: "Abrir Loopert" },
  { keys: "2", action: "Abrir Radio Health" },
  { keys: "P", action: "Ligar ou sair da apresentação" },
  { keys: "/", action: "Focar a busca" },
  { keys: "?", action: "Ver estes atalhos" },
] as const;

export function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(el.closest("[role='dialog']"));
}
