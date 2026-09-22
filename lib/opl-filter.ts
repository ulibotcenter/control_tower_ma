import type { ActionItem, OpenPointStatus } from "./types";

/** Recorte da tabela de pendências. O registro continua no store. */
export type OplFilter = "abertos" | "atrasadas" | "concluidas" | "tudo";

export const OPL_FILTERS: { value: OplFilter; label: string }[] = [
  { value: "abertos", label: "Abertos" },
  { value: "atrasadas", label: "Atrasadas" },
  { value: "concluidas", label: "Concluídas" },
  { value: "tudo", label: "Tudo" },
];

export function pointInFilter(status: OpenPointStatus, filter: OplFilter) {
  if (filter === "tudo") return true;
  if (filter === "concluidas") return status === "resolvido";
  if (filter === "atrasadas") return status === "travado";
  return status !== "resolvido";
}

export function taskInFilter(status: ActionItem["status"], filter: OplFilter) {
  if (filter === "tudo") return true;
  if (filter === "concluidas") return status === "done";
  if (filter === "atrasadas") return status === "late";
  return status === "open" || status === "late";
}
