"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";
import type { AiProposal, AiProposalKind } from "@/lib/types";
import { requestAiReading } from "./request-reading";

const KIND: Record<AiProposalKind, string> = {
  opl: "Ponto",
  tarefa: "Tarefa",
  nota: "Nota",
  classificacao: "Classificação",
  atencao: "Atenção",
};

export function ProposalQueue({
  configured,
  deals,
  proposals,
}: {
  configured: boolean;
  deals: { slug: string; name: string; id: string }[];
  proposals: AiProposal[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(configured ? null : "IA não configurada");

  async function ask(slug: string) {
    if (busy) return;
    setBusy(slug);
    setNotice(null);
    const result = await requestAiReading(slug);
    setBusy(null);
    if (!result.configured) {
      setNotice("IA não configurada");
      toast("IA não configurada", "warn");
      return;
    }
    if (result.error) {
      setNotice(result.error);
      toast(result.error, "err");
      if (result.count) router.refresh();
      return;
    }
    const line = result.message || "Nenhuma proposta.";
    setNotice(line);
    toast(line, result.count ? "ok" : "warn");
    if (result.count) router.refresh();
  }

  async function mark(id: string, status: "aceita" | "descartada" | "editada") {
    const res = await fetch(`/api/ai/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  }

  async function commit(proposal: AiProposal) {
    if (proposal.kind !== "atencao") {
      const res = await postFact(proposal, deals);
      if (!res.ok) {
        let message = "Não foi possível gravar.";
        try {
          const data = (await res.json()) as { message?: string };
          if (data.message) message = data.message;
        } catch {
          /* a API antiga nem sempre manda mensagem */
        }
        toast(message, "err");
        return false;
      }
    }
    const ok = await mark(proposal.id, "aceita");
    if (!ok) {
      toast("A fila não atualizou.", "warn");
      return false;
    }
    return true;
  }

  async function accept(proposal: AiProposal) {
    if (busy) return;
    setBusy(proposal.id);
    try {
      const ok = await commit(proposal);
      if (!ok) return;
      toast(proposal.kind === "atencao" ? "Proposta retirada da fila. Nenhum fato foi gravado." : "Proposta aceita.");
      router.refresh();
    } catch {
      toast("Falha de rede.", "err");
    } finally {
      setBusy(null);
    }
  }

  async function acceptAll(dealSlug: string) {
    const rows = proposals.filter((proposal) => proposal.dealSlug === dealSlug);
    if (!rows.length || busy) return;
    if (!window.confirm(`Aceitar as ${rows.length}?`)) return;
    setBusy(`all:${dealSlug}`);
    try {
      for (const proposal of rows) {
        const ok = await commit(proposal);
        if (!ok) {
          router.refresh();
          return;
        }
      }
      const onlyAttention = rows.every((proposal) => proposal.kind === "atencao");
      toast(onlyAttention ? "Propostas retiradas da fila. Nenhum fato foi gravado." : "Propostas aceitas.");
      router.refresh();
    } catch {
      toast("Falha de rede.", "err");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function discard(proposal: AiProposal) {
    if (busy) return;
    setBusy(proposal.id);
    try {
      const ok = await mark(proposal.id, "descartada");
      if (!ok) {
        toast("Não foi possível descartar.", "err");
        return;
      }
      toast("Proposta descartada.");
      router.refresh();
    } catch {
      toast("Falha de rede.", "err");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section id="ia" className="ia-panel paper no-print" aria-labelledby="ia-title">
      <div className="ia-head">
        <h2 id="ia-title" className="war-label">
          Leitura da IA
        </h2>
      </div>
      <p className="ia-lead">A IA propõe. Quem opera aceita, edita ou descarta. Nada entra sozinho.</p>
      {notice ? <p className={notice === "IA não configurada" ? "ia-unconfigured" : "ia-lead"}>{notice}</p> : null}
      <div className="ia-actions">
        {deals.map((deal) => {
          const pending = proposals.filter((proposal) => proposal.dealSlug === deal.slug);
          const acceptLabel = deals.length > 1 ? `Aceitar todos · ${deal.name}` : "Aceitar todos";
          return (
            <span key={deal.slug} className="ia-deal">
              <button type="button" className="btn btn-soft" disabled={Boolean(busy)} onClick={() => void ask(deal.slug)}>
                {busy === deal.slug ? "Lendo…" : `Pedir leitura à IA · ${deal.name}`}
              </button>
              {pending.length > 0 ? (
                <button type="button" className="btn btn-line" disabled={Boolean(busy)} onClick={() => void acceptAll(deal.slug)}>
                  {busy === `all:${deal.slug}` ? "Aceitando…" : acceptLabel}
                </button>
              ) : null}
            </span>
          );
        })}
      </div>
      {proposals.length === 0 ? (
        <p className="ia-lead">Nenhuma proposta pendente.</p>
      ) : (
        <ul className="ia-list">
          {proposals.map((proposal) => {
            const deal = deals.find((item) => item.slug === proposal.dealSlug);
            const edit = editHref(proposal);
            return (
              <li key={proposal.id} className="ia-item">
                <p className="ia-kind">
                  {KIND[proposal.kind]}
                  {deal ? ` · ${deal.name}` : ""}
                </p>
                <p>{proposal.payload.text}</p>
                {proposal.kind === "atencao" ? (
                  <p className="ia-kind">Aceitar só tira da fila. Não grava ponto, tarefa, nota nem classificação.</p>
                ) : null}
                <div className="ia-row">
                  <button type="button" className="btn btn-soft" disabled={Boolean(busy)} onClick={() => void accept(proposal)}>
                    Aceitar
                  </button>
                  {edit ? (
                    <button type="button" className="btn btn-line" onClick={() => router.push(edit)}>
                      Editar
                    </button>
                  ) : null}
                  <button type="button" className="btn btn-ghost" disabled={Boolean(busy)} onClick={() => void discard(proposal)}>
                    Descartar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function editHref(proposal: AiProposal) {
  if (proposal.kind === "opl" || proposal.kind === "tarefa" || proposal.kind === "nota") {
    return `/deals/${proposal.dealSlug}?proposta=${encodeURIComponent(proposal.id)}#opl`;
  }
  if (proposal.kind === "classificacao" && proposal.payload.inboxId) {
    const params = new URLSearchParams({ deal: proposal.dealSlug, proposta: proposal.id });
    if (proposal.payload.type) params.set("tipo", proposal.payload.type);
    if (proposal.payload.workstreamSlug) params.set("frente", proposal.payload.workstreamSlug);
    if (proposal.payload.docStatus) params.set("situacao", proposal.payload.docStatus);
    return `/inbox/${proposal.payload.inboxId}?${params.toString()}`;
  }
  return null;
}

async function postFact(proposal: AiProposal, deals: { slug: string; id: string }[]) {
  if (proposal.kind === "opl") {
    return fetch("/api/open-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealSlug: proposal.dealSlug,
        title: proposal.payload.title || proposal.payload.text,
        owner: proposal.payload.owner ?? "",
        due: proposal.payload.due ?? "",
        pillarSlug: proposal.payload.pillarSlug ?? null,
        visibility: proposal.payload.visibility ?? "advisors",
        status: "aberto",
      }),
    });
  }
  if (proposal.kind === "tarefa") {
    return fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealSlug: proposal.dealSlug,
        title: proposal.payload.title || proposal.payload.text,
        owner: proposal.payload.owner ?? "",
        due: proposal.payload.due ?? "",
        pillarSlug: proposal.payload.pillarSlug ?? null,
        visibility: proposal.payload.visibility ?? "advisors",
        status: "open",
      }),
    });
  }
  if (proposal.kind === "nota") {
    return fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealSlug: proposal.dealSlug,
        body: proposal.payload.body || proposal.payload.text,
        visibility: proposal.payload.visibility ?? "operate",
      }),
    });
  }
  if (proposal.kind === "classificacao" && proposal.payload.inboxId) {
    return fetch(`/api/inbox/${proposal.payload.inboxId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealId: proposal.payload.dealId || deals.find((deal) => deal.slug === proposal.dealSlug)?.id,
        type: proposal.payload.type,
        workstreamSlug: proposal.payload.workstreamSlug,
        status: proposal.payload.docStatus,
      }),
    });
  }
  return new Response(null, { status: 400 });
}
