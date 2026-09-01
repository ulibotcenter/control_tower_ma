"use client";

import { useEffect, useState } from "react";
import { onToast, takeFlash, type ToastPayload, type ToastTone } from "@/lib/toast";

const HOLD_MS = 4200;

export function ToastHost() {
  const [items, setItems] = useState<(ToastPayload & { id: number })[]>([]);

  useEffect(() => {
    const flash = takeFlash();
    if (flash) push(flash);
    return onToast((payload) => push(payload));

    function push(payload: ToastPayload) {
      const id = Date.now() + Math.random();
      setItems((cur) => [...cur.slice(-2), { ...payload, id }]);
      window.setTimeout(() => {
        setItems((cur) => cur.filter((t) => t.id !== id));
      }, HOLD_MS);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="no-print pointer-events-none fixed inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((t) => (
        <p
          key={t.id}
          role="status"
          className={`pointer-events-auto max-w-sm px-3.5 py-2.5 text-sm font-medium shadow-lg ${toneCls(t.tone)}`}
        >
          {t.message}
        </p>
      ))}
    </div>
  );
}

function toneCls(tone: ToastTone) {
  if (tone === "err") return "bg-alert text-cream";
  if (tone === "warn") return "bg-navy text-cream border border-brand";
  return "bg-navy text-cream";
}
