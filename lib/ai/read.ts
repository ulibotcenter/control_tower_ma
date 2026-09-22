import { blockersFrom } from "../data/pillar-view";
import { getDealBundle } from "../data/provider";
import { workstreams } from "../data/seed";
import { addAiProposals, listDecisions, listInbox } from "../data/store";
import type { AiProposal } from "../types";
import { buildDealBrief } from "./context";
import { AI_UNCONFIGURED, isOpenRouterConfigured } from "./env";
import { askOpenRouter } from "./openrouter";
import { parseModelProposals } from "./proposals";

export type ReadOutcome = {
  configured: boolean;
  message?: string;
  proposals: AiProposal[];
};

/**
 * Lê um deal e grava propostas. Sem chave, devolve a frase e lista vazia.
 * Não completa a lista com fato inventado.
 */
export async function readDealProposals(slug: string): Promise<ReadOutcome> {
  if (!isOpenRouterConfigured()) {
    return { configured: false, message: AI_UNCONFIGURED, proposals: [] };
  }

  const bundle = await getDealBundle(slug, "operate");
  if (!bundle) return { configured: true, message: "Deal desconhecido.", proposals: [] };

  const [decisions, inbox] = await Promise.all([listDecisions(), listInbox()]);
  const files = inbox
    .filter((file) => !file.classified)
    .map((file) => ({ id: file.id, name: file.name }));
  const brief = buildDealBrief({
    name: bundle.deal.name,
    slug: bundle.deal.slug,
    headline: bundle.deal.headline,
    blockers: blockersFrom(bundle.risks, bundle.checklist, 6, bundle.actions).map((item) => item.line),
    openPoints: bundle.openPoints,
    tasks: bundle.actions,
    decisions: decisions.filter((decision) => decision.dealId === bundle.deal.id || decision.dealId === null),
    files,
    fronts: workstreams.filter((item) => item.dealId === bundle.deal.id).map((item) => item.slug),
  });

  const answer = await askOpenRouter(brief);
  if (!answer.ok) {
    console.error("[ai] leitura falhou", { slug, status: answer.status });
    return { configured: true, message: answer.message, proposals: [] };
  }

  const drafts = parseModelProposals(answer.content, {
    brief,
    dealId: bundle.deal.id,
    files,
    workstreamSlugs: workstreams.filter((item) => item.dealId === bundle.deal.id).map((item) => item.slug),
  });
  if (!drafts.length) {
    return { configured: true, message: "Nenhuma proposta a partir deste contexto.", proposals: [] };
  }

  const proposals = await addAiProposals(
    drafts.map((draft) => ({
      dealSlug: bundle.deal.slug,
      kind: draft.kind,
      payload:
        draft.kind === "classificacao" ? { ...draft.payload, dealId: bundle.deal.id } : draft.payload,
    })),
  );
  return { configured: true, proposals };
}
