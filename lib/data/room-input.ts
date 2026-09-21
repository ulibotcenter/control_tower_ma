import { isPillarSlug, type PillarSlug } from "../pillars";
import type { ActionItem, OpenPointStatus, Visibility } from "../types";

export const OPEN_POINT_STATUSES = ["aberto", "em_curso", "travado", "resolvido"] as const;
export const ACTION_STATUSES = ["open", "late", "done"] as const;

export function cleanText(value: unknown, max = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function parseVisibility(value: unknown): Visibility | null {
  if (value === "operate" || value === "advisors" || value === "target") return value;
  return null;
}

/** `null` = sem pilar. `undefined` = valor inválido. */
export function parsePillar(value: unknown): PillarSlug | null | undefined {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return undefined;
  return isPillarSlug(value) ? value : undefined;
}

export function parseOpenPointStatus(value: unknown): OpenPointStatus | null {
  if (typeof value !== "string") return null;
  return (OPEN_POINT_STATUSES as readonly string[]).includes(value) ? (value as OpenPointStatus) : null;
}

export function parseActionStatus(value: unknown): ActionItem["status"] | null {
  if (typeof value !== "string") return null;
  return (ACTION_STATUSES as readonly string[]).includes(value) ? (value as ActionItem["status"]) : null;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
