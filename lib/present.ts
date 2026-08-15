import { cookies } from "next/headers";

export const PRESENT_COOKIE = "ct-present";

export async function getPresent(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(PRESENT_COOKIE)?.value === "1";
}
