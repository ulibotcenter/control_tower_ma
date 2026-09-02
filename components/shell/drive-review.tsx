"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DriveLink } from "@/components/ui/drive-link";
import { DRIVE_REVIEW_EVENT, type DriveReviewItem } from "./drive-sync-button";

const SEEN_KEY = "ct-drive-seen";

function readSeen(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeSeen(ids: Set<string>) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function DriveReviewHost() {
  const [files, setFiles] = useState<DriveReviewItem[] | null>(null);

  useEffect(() => {
    function onReview(e: Event) {
      const ce = e as CustomEvent<{ files?: DriveReviewItem[] }>;
      const incoming = ce.detail?.files ?? [];
      const seen = readSeen();
      const next = incoming.filter((f) => !seen.has(f.id));
      setFiles(next.length ? next : null);
    }
    window.addEventListener(DRIVE_REVIEW_EVENT, onReview);

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/drive/sync?peek=1");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { files?: DriveReviewItem[] };
        const seen = readSeen();
        const next = (data.files ?? []).filter((f) => !seen.has(f.id));
        if (!cancelled && next.length) setFiles(next);
      } catch {
        /* peek silencioso */
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener(DRIVE_REVIEW_EVENT, onReview);
    };
  }, []);

  if (!files || files.length === 0) return null;

  function dismiss(id: string) {
    const seen = readSeen();
    seen.add(id);
    writeSeen(seen);
    setFiles((cur) => {
      const next = (cur ?? []).filter((f) => f.id !== id);
      return next.length ? next : null;
    });
  }

  return (
    <div
      className="no-print fixed inset-0 z-[58] flex items-center justify-center bg-navy/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drive-review-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col paper p-5 shadow-xl sm:p-6">
        <h2 id="drive-review-title" className="serif text-2xl text-navy">
          Novos no Drive
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          Nome, pasta e data. Sem resumo inventado. Arquivo novo não é item concluído.
        </p>
        <ul className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto">
          {files.map((f) => (
            <li key={f.id} className="border border-line px-3 py-3">
              <p className="font-medium text-navy">{f.name}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {f.folder} · {f.date}
                {f.driveUrl ? (
                  <>
                    {" "}
                    · <DriveLink href={f.driveUrl}>Abrir</DriveLink>
                  </>
                ) : null}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-[12px] text-muted">Manter na bandeja</span>
                <button type="button" className="text-[12px] font-semibold text-navy underline underline-offset-2" onClick={() => dismiss(f.id)}>
                  Já vi / dispensar
                </button>
                <Link href={`/inbox/${f.id}`} className="text-[12px] font-semibold text-brand underline underline-offset-2">
                  Classificar
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[12px] leading-relaxed text-muted">
          Nada disto entra no corte até a Eleva classificar.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Link href="/inbox" className="text-[13px] font-semibold text-navy underline underline-offset-2">
            Abrir bandeja
          </Link>
          <button type="button" className="btn" onClick={() => setFiles(null)}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
