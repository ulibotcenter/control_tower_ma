"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function MutableStatus({
  id,
  kind,
  status,
  options,
  label,
}: {
  id: string;
  kind: "open-points" | "actions";
  status: string;
  options: { value: string; label: string }[];
  label: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);

  async function onChange(next: string) {
    const previous = value;
    setValue(next);
    setBusy(true);
    try {
      const res = await fetch(`/api/${kind}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setValue(previous);
        toast("Não foi possível atualizar o status.");
        return;
      }
      router.refresh();
    } catch {
      setValue(previous);
      toast("Falha de rede ao atualizar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      aria-label={label}
      className="room-status"
      value={value}
      disabled={busy}
      onChange={(event) => void onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
