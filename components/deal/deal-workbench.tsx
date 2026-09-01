"use client";

import { useMemo, useState } from "react";
import type { ActionItem, DriveDocument, MeetingMode, Risk } from "@/lib/types";
import { Freshness } from "@/components/ui/freshness";
import { ActionBoard } from "./action-board";
import { RisksBoard } from "./risks-board";
import { DocsByCategory } from "./lists";

export function DealWorkbench({
  actions,
  risks,
  documents,
  mode,
  present,
  showSearch = true,
  showDocs = true,
  compact,
}: {
  actions: ActionItem[];
  risks: Risk[];
  documents: DriveDocument[];
  mode: MeetingMode;
  present: boolean;
  showSearch?: boolean;
  showDocs?: boolean;
  compact?: boolean;
}) {
  const tight = compact ?? present;
  const target = mode === "target";
  const [q, setQ] = useState("");
  const qdocs = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return documents;
    return documents.filter((d) =>
      `${d.title} ${d.note ?? ""} ${d.type} ${d.workstreamSlug ?? ""}`.toLowerCase().includes(needle),
    );
  }, [documents, q]);

  return (
    <>
      {showSearch && (
        <div className="no-print mb-8 paper px-4 py-3">
          <label className="m-0 text-[12px] font-normal normal-case tracking-normal text-muted">
            Busca rápida — ações, riscos e documentos
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="TARGA, NDA, João…  (/)"
              data-search
              className="mt-1"
            />
          </label>
        </div>
      )}

      <section id="riscos" className="mb-10">
        <h2 className="serif mb-1 text-2xl text-navy">
          {target ? "Pendências e pontos de atenção" : present ? "Riscos críticos" : "Riscos e issues"}
        </h2>
        <Freshness trust="review" mode={mode} />
        {!present && (
          <p className="mb-4 mt-2 max-w-2xl text-sm text-muted">
            {target
              ? "Crítico precisa ser resolvido para avançar. Em tratamento já está encaminhado."
              : "Crítico pode parar o deal. Issue é problema já em cima da mesa."}
          </p>
        )}
        <div className={present ? "mt-4" : ""}>
          <RisksBoard items={risks} mode={mode} query={q} compact={tight} />
        </div>
      </section>

      <section id="acoes" className="mb-10">
        <h2 className="serif mb-1 text-2xl text-navy">Próximas ações</h2>
        <Freshness mode={mode} />
        {!present && (
          <p className="mb-4 mt-2 max-w-2xl text-sm text-muted">
            Quem faz, até quando, e se está atrasada.
          </p>
        )}
        <div className={present ? "mt-4" : ""}>
          <ActionBoard items={actions} query={q} compact={tight} />
        </div>
      </section>

      {showDocs && (
        <section id="docs" className="mb-10">
          <h2 className="serif mb-1 text-2xl text-navy">Documentos-chave</h2>
          <Freshness trust="review" mode={mode} />
          <p className="mb-4 mt-2 text-sm text-muted">
            Sempre abre o Google Drive em nova aba. A torre não hospeda o arquivo.
          </p>
          <DocsByCategory items={qdocs} />
        </section>
      )}
    </>
  );
}
