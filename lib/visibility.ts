import type { MeetingMode, Sensitivity, Visible } from "./types";

const ADVISORS_HIDDEN: Sensitivity[] = ["eleva_notes", "credentials"];

const TARGET_HIDDEN: Sensitivity[] = [
  "sjdc",
  "price",
  "valuation",
  "nda_eleva",
  "hunter",
  "adr_exposure",
  "eleva_notes",
  "credentials",
  "walkaway",
];

export function isVisible(mode: MeetingMode, item: Visible): boolean {
  if (mode === "operate") return true;

  if (mode === "advisors") {
    if (item.visibility === "operate") return false;
    return !item.sensitivities.some((s) => ADVISORS_HIDDEN.includes(s));
  }

  if (item.visibility !== "target") return false;
  return !item.sensitivities.some((s) => TARGET_HIDDEN.includes(s));
}

export function filterVisible<T extends Visible>(mode: MeetingMode, items: T[]): T[] {
  return items.filter((item) => isVisible(mode, item));
}

export function canSeeInbox(mode: MeetingMode) {
  return mode === "operate";
}

export function canSeeDecisions(mode: MeetingMode): "full" | "summary" | "hidden" {
  if (mode === "operate") return "full";
  if (mode === "advisors") return "summary";
  return "hidden";
}

export function canRegisterDecision(mode: MeetingMode) {
  return mode === "operate";
}

export function canSeePriceAndThesis(mode: MeetingMode) {
  return mode !== "target";
}

export function canSeeProtectionNotes(mode: MeetingMode) {
  return mode === "operate";
}
