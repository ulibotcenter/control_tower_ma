export const ONBOARD_COOKIE = "ct-onboarded";
export const ONBOARD_MAX_AGE = 60 * 60 * 24 * 400;

export function markOnboarded() {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ONBOARD_COOKIE}=1; Path=/; Max-Age=${ONBOARD_MAX_AGE}; SameSite=Lax${secure}`;
}

export function isOnboardedCookie(value: string | undefined | null) {
  return value === "1";
}
