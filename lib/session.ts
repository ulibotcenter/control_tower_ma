/**
 * Política de sessão.
 *
 * Absoluta: 12h no cookie HMAC (lib/auth.ts).
 * Inatividade: 90 min (NEXT_PUBLIC_SESSION_IDLE_MINUTES).
 * Aviso: 2 min antes. Cookie `ct-seen` (não HttpOnly) é o relógio
 * que o middleware e o SessionGuard compartilham.
 *
 * Compatível com o cookie atual e com Supabase Auth: o idle não
 * depende do provedor — só do último toque na torre.
 */

export const SEEN_COOKIE = "ct-seen";
export const IDLE_WARN_MS = 2 * 60 * 1000;

export function idleLimitMs() {
  const n = Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES || 90);
  const minutes = Number.isFinite(n) && n >= 5 ? n : 90;
  return minutes * 60 * 1000;
}

export function isIdleExpired(seenValue: string | undefined | null, now = Date.now()) {
  if (!seenValue) return false;
  const t = Number(seenValue);
  if (!Number.isFinite(t) || t <= 0) return false;
  return now - t > idleLimitMs();
}

export function writeSeenCookie(now = Date.now()) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SEEN_COOKIE}=${now}; Path=/; Max-Age=${60 * 60 * 12}; SameSite=Lax${secure}`;
}

export function clearClientSessionBits() {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const drop = (name: string) => {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  };
  drop(SEEN_COOKIE);
  try {
    sessionStorage.removeItem("ct-flash");
  } catch {
    /* ignore */
  }
}
