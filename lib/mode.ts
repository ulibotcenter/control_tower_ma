import { cookies } from "next/headers";
import type { MeetingMode } from "./types";

export const MODE_COOKIE = "ct-mode";

export function parseMode(value: string | undefined | null): MeetingMode {
  if (value === "advisors" || value === "target" || value === "operate") return value;
  return "operate";
}

export async function getMode(): Promise<MeetingMode> {
  const jar = await cookies();
  return parseMode(jar.get(MODE_COOKIE)?.value);
}
