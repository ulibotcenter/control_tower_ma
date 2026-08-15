"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";

export function LoginFlash({ kind }: { kind?: "left" | "idle" | null }) {
  useEffect(() => {
    if (kind === "left") toast("Sessão encerrada.");
    if (kind === "idle") toast("Sessão encerrada por inatividade.");
  }, [kind]);
  return null;
}
