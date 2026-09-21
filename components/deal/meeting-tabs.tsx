"use client";

import { useEffect, useState, type ReactNode } from "react";

export function MeetingTabs({
  pendencias,
  anotacoes,
}: {
  pendencias: ReactNode;
  anotacoes: ReactNode;
}) {
  const [tab, setTab] = useState<"pendencias" | "anotacoes">("pendencias");

  useEffect(() => {
    if (window.location.hash === "#notas") setTab("anotacoes");
  }, []);

  return (
    <div className="meet-tabs">
      <div className="meet-tablist" role="tablist" aria-label="Reunião">
        <button
          type="button"
          role="tab"
          id="tab-pendencias"
          className={`chip${tab === "pendencias" ? " is-on" : ""}`}
          aria-selected={tab === "pendencias"}
          aria-controls="painel-pendencias"
          onClick={() => setTab("pendencias")}
        >
          Pendências
        </button>
        <button
          type="button"
          role="tab"
          id="tab-anotacoes"
          className={`chip${tab === "anotacoes" ? " is-on" : ""}`}
          aria-selected={tab === "anotacoes"}
          aria-controls="painel-anotacoes"
          onClick={() => setTab("anotacoes")}
        >
          Anotações
        </button>
      </div>
      <div
        role="tabpanel"
        id="painel-pendencias"
        aria-labelledby="tab-pendencias"
        hidden={tab !== "pendencias"}
      >
        {pendencias}
      </div>
      <div
        role="tabpanel"
        id="painel-anotacoes"
        aria-labelledby="tab-anotacoes"
        hidden={tab !== "anotacoes"}
      >
        {anotacoes}
      </div>
    </div>
  );
}
