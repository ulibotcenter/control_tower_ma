"use client";

import { useEffect, useRef, useState } from "react";
import { clearClientSessionBits, idleLimitMs, IDLE_WARN_MS, writeSeenCookie } from "@/lib/session";
import { toast } from "@/lib/toast";

const TICK = 15_000;
const TOUCH_GAP = 12_000;

export function SessionGuard() {
  const last = useRef(Date.now());
  const [remain, setRemain] = useState<number | null>(null);
  const warned = useRef(false);

  useEffect(() => {
    last.current = Date.now();
    writeSeenCookie(last.current);

    function touch() {
      const now = Date.now();
      if (now - last.current < TOUCH_GAP) return;
      last.current = now;
      warned.current = false;
      setRemain(null);
      writeSeenCookie(now);
    }

    window.addEventListener("pointerdown", touch, { passive: true });
    window.addEventListener("keydown", touch);
    window.addEventListener("scroll", touch, { passive: true });
    document.addEventListener("visibilitychange", touch);

    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      const idle = Date.now() - last.current;
      const limit = idleLimitMs();
      const left = limit - idle;
      if (left <= 0) {
        window.clearInterval(id);
        void expire();
        return;
      }
      if (left <= IDLE_WARN_MS) {
        setRemain(Math.max(15, Math.ceil(left / 1000)));
        if (!warned.current) {
          warned.current = true;
          toast("A sessão expira em instantes por inatividade.", "warn");
        }
      } else {
        setRemain(null);
      }
    }, TICK);

    return () => {
      window.removeEventListener("pointerdown", touch);
      window.removeEventListener("keydown", touch);
      window.removeEventListener("scroll", touch);
      document.removeEventListener("visibilitychange", touch);
      window.clearInterval(id);
    };
  }, []);

  async function expire() {
    clearClientSessionBits();
    try {
      await fetch("/api/auth/logout?idle=1", { method: "POST", redirect: "manual" });
    } catch {
      /* segue para o login mesmo se a rede falhar */
    }
    window.location.assign("/login?idle=1");
  }

  function stay() {
    last.current = Date.now();
    warned.current = false;
    setRemain(null);
    writeSeenCookie(last.current);
  }

  if (remain == null) return null;

  const minutes = Math.max(1, Math.ceil(remain / 60));

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-[55] border-t-2 border-brand bg-navy px-4 py-3 text-cream shadow-lg sm:bottom-4 sm:inset-x-auto sm:right-4 sm:max-w-sm sm:border">
      <p className="text-sm font-medium">
        Sessão inativa. Expira em cerca de {minutes} min.
      </p>
      <p className="mt-1 text-[13px] text-cream/80">
        Toque em continuar para permanecer nesta tela.
      </p>
      <button type="button" className="btn btn-primary mt-3 min-h-11 w-full sm:w-auto" onClick={stay}>
        Continuar nesta sessão
      </button>
    </div>
  );
}
