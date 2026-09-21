"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const MeetingTabContext = createContext<"pendencias" | "anotacoes">("pendencias");

export function useMeetingTab() {
  return useContext(MeetingTabContext);
}

export function MeetingTabs({
  pendencias,
  anotacoes,
  tools = null,
}: {
  pendencias: ReactNode;
  anotacoes: ReactNode;
  tools?: ReactNode;
}) {
  const [tab, setTab] = useState<"pendencias" | "anotacoes">("pendencias");

  useEffect(() => {
    if (window.location.hash === "#notas") setTab("anotacoes");
  }, []);

  return (
    <MeetingTabContext.Provider value={tab}>
      <div className="meet-bar">
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
        {tools ? <div className="meet-actions">{tools}</div> : null}
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
    </MeetingTabContext.Provider>
  );
}
