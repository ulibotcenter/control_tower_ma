export type ToastTone = "ok" | "warn" | "err";

export type ToastPayload = {
  message: string;
  tone: ToastTone;
};

const EVENT = "ct-toast";
const FLASH = "ct-flash";

export function toast(message: string, tone: ToastTone = "ok") {
  if (typeof window === "undefined") return;
  const detail: ToastPayload = { message, tone };
  window.dispatchEvent(new CustomEvent<ToastPayload>(EVENT, { detail }));
  try {
    sessionStorage.setItem(FLASH, JSON.stringify({ ...detail, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function takeFlash(): ToastPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(FLASH);
    if (!raw) return null;
    sessionStorage.removeItem(FLASH);
    const data = JSON.parse(raw) as ToastPayload & { at?: number };
    if (data.at && Date.now() - data.at > 8_000) return null;
    if (!data.message) return null;
    return { message: data.message, tone: data.tone ?? "ok" };
  } catch {
    return null;
  }
}

export function onToast(handler: (payload: ToastPayload) => void) {
  function listen(e: Event) {
    const ce = e as CustomEvent<ToastPayload>;
    if (ce.detail?.message) handler(ce.detail);
  }
  window.addEventListener(EVENT, listen);
  return () => window.removeEventListener(EVENT, listen);
}
