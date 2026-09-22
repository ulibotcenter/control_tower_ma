import type { ActionItem, OpenPointStatus } from "./types";

/** Recorte da tabela de pendências. Vários chips. O registro continua no store. */
export type OplChip = "abertos" | "atrasadas" | "concluidas";

export const OPL_CHIPS: { value: OplChip; label: string }[] = [
  { value: "abertos", label: "Abertos" },
  { value: "atrasadas", label: "Atrasadas" },
  { value: "concluidas", label: "Concluídas" },
];

/** Aberto e atrasado ligados. Concluído fica de fora até o operador ligar. */
export const OPL_DEFAULT: OplChip[] = ["abertos", "atrasadas"];

const ALL: OplChip[] = ["abertos", "atrasadas", "concluidas"];

export function toggleOplChip(current: OplChip[], chip: OplChip | "tudo"): OplChip[] {
  if (chip === "tudo") {
    return current.length === ALL.length ? [...OPL_DEFAULT] : [...ALL];
  }
  if (!current.includes(chip)) return [...current, chip];
  const next = current.filter((item) => item !== chip);
  return next.length ? next : [...OPL_DEFAULT];
}

export function pointInChips(status: OpenPointStatus, chips: OplChip[]) {
  return chips.some((chip) => {
    if (chip === "concluidas") return status === "resolvido";
    if (chip === "atrasadas") return status === "travado";
    return status === "aberto" || status === "em_curso";
  });
}

export function taskInChips(status: ActionItem["status"], chips: OplChip[]) {
  return chips.some((chip) => {
    if (chip === "concluidas") return status === "done";
    if (chip === "atrasadas") return status === "late";
    return status === "open";
  });
}
