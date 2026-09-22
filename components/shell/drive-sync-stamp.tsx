"use client";

import { useEffect, useState } from "react";
import { formatDriveSyncStamp } from "@/lib/format";
import { DRIVE_SYNCED_EVENT, DRIVE_SYNCED_KEY, readStoredDriveSyncedAt } from "./drive-sync-button";

/**
 * Hora da última varredura ok. Só vira “atualizado” depois de um POST com ok.
 * O store manda o valor do servidor; o browser guarda o último sucesso local.
 */
export function DriveSyncStamp({
  syncedAt = null,
  className = "drive-sync-stamp",
}: {
  syncedAt?: string | null;
  className?: string;
}) {
  const [iso, setIso] = useState<string | null>(syncedAt);

  useEffect(() => {
    const local = readStoredDriveSyncedAt();
    if (local && (!syncedAt || local > syncedAt)) setIso(local);
    else if (syncedAt) setIso(syncedAt);

    function onSynced(ev: Event) {
      const detail = (ev as CustomEvent<{ syncedAt?: string }>).detail;
      if (detail?.syncedAt) setIso(detail.syncedAt);
    }
    window.addEventListener(DRIVE_SYNCED_EVENT, onSynced);
    return () => window.removeEventListener(DRIVE_SYNCED_EVENT, onSynced);
  }, [syncedAt]);

  useEffect(() => {
    if (!iso) return;
    try {
      localStorage.setItem(DRIVE_SYNCED_KEY, iso);
    } catch {
      /* private mode */
    }
  }, [iso]);

  return <p className={className}>{formatDriveSyncStamp(iso)}</p>;
}
