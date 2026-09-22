import { ProposalQueue } from "@/components/ai/proposal-queue";
import { AppShell } from "@/components/shell/app-shell";
import { focusSlugFromQuery } from "@/components/shell/focus-deal";
import { isOpenRouterConfigured } from "@/lib/ai/env";
import { getProgram } from "@/lib/data/provider";
import { listAiProposals } from "@/lib/data/store";
import { viewChrome } from "@/lib/mode-meta";
import { getLockedDeal, getMode } from "@/lib/mode";
import { getPresent } from "@/lib/present";
import { redirect } from "next/navigation";

/**
 * Fila de um deal. A capa (`/#ia`) continua com os dois botões.
 * Operar só — Alvo e Apresentar não têm esta rota.
 */
export default async function IaPage({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string }>;
}) {
  const { deal: dealQuery } = await searchParams;
  const slug = focusSlugFromQuery(dealQuery);
  const mode = await getMode();
  const present = await getPresent();
  if (!viewChrome(mode, present).showIa) {
    redirect(slug ? `/deals/${slug}` : "/");
  }
  if (!slug) redirect("/#ia");

  const onlyDeal = await getLockedDeal();
  const program = await getProgram(mode, { onlyDeal });
  const deal = program.deals.find((item) => item.slug === slug);
  if (!deal) redirect("/");

  const proposals = await listAiProposals({ status: "pendente", dealSlug: slug }).catch(() => []);

  return (
    <AppShell focusSlug={slug}>
      <header className="cover-intro max-w-2xl">
        <p className="kicker">IA</p>
        <h1 className="cover-title">Leitura da IA · {deal.name}</h1>
      </header>
      <ProposalQueue
        configured={isOpenRouterConfigured()}
        deals={[{ slug: deal.slug, name: deal.name, id: deal.id }]}
        proposals={proposals}
        selection
      />
    </AppShell>
  );
}
