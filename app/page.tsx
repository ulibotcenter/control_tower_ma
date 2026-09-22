import { ProposalQueue } from "@/components/ai/proposal-queue";
import { AppShell } from "@/components/shell/app-shell";
import { isOpenRouterConfigured } from "@/lib/ai/env";
import { AttentionPanel } from "@/components/home/attention-panel";
import { DealCard } from "@/components/home/deal-card";
import { ActivityFeed } from "@/components/home/activity-feed";
import { WithTerms } from "@/components/ui/with-terms";
import { focusSlugFromQuery } from "@/components/shell/focus-deal";
import { getActivity, getAttentionItems, getProgram } from "@/lib/data/provider";
import { MODE_META, TARGET_COPY, viewChrome } from "@/lib/mode-meta";
import { getLockedDeal, getMode } from "@/lib/mode";
import { getPresent } from "@/lib/present";
import { Freshness } from "@/components/ui/freshness";
import { DriveSyncStamp } from "@/components/shell/drive-sync-stamp";
import { getDriveSyncedAt, listAiProposals } from "@/lib/data/store";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string }>;
}) {
  const { deal: dealQuery } = await searchParams;
  const mode = await getMode();
  const onlyDeal = await getLockedDeal();
  const present = await getPresent();
  const program = await getProgram(mode, { onlyDeal });
  const chrome = viewChrome(mode, present);
  const target = mode === "target";
  // Trilho só em Operar. No Alvo e na apresentação a capa é leitura.
  const showRail = mode === "operate" && !present;

  const slugOf = new Map(program.deals.map((deal) => [deal.id, deal.slug]));
  const attention = showRail ? getAttentionItems(mode, { onlyDeal }) : [];
  const activity = showRail ? await getActivity(mode, 8, { onlyDeal }) : [];
  const feed = activity.map((item) => ({
    ...item,
    href: hrefOnCover(item.href, item.dealId ? (slugOf.get(item.dealId) ?? null) : null),
  }));

  const several = program.deals.length > 1;
  const gridClass = `cover-grid${several ? " is-pair" : ""}${present ? " is-deck" : ""}`;
  const driveSyncedAt = showRail ? await getDriveSyncedAt().catch(() => null) : null;
  const proposals = showRail ? await listAiProposals({ status: "pendente" }).catch(() => []) : [];

  return (
    <AppShell focusSlug={focusSlugFromQuery(dealQuery)}>
      <header className="cover-intro max-w-2xl">
        <p className="kicker">{target ? TARGET_COPY.homeKicker : "Portfólio"}</p>
        <h1 className="cover-title">{target ? TARGET_COPY.homeTitle : "Operações"}</h1>
        <Freshness mode={mode} />
        {showRail ? <DriveSyncStamp syncedAt={driveSyncedAt} className="drive-sync-stamp cover-sync-stamp" /> : null}
        {showRail ? (
          <p className="ia-jump">
            <a href="#ia">Leitura da IA</a>
          </p>
        ) : null}
        {target && (
          <p className="mt-3 text-[15px] leading-relaxed">
            <WithTerms text={MODE_META.target.homeLead} />
          </p>
        )}
      </header>

      <div className={`mt-8 grid gap-8 ${showRail ? "xl:grid-cols-[minmax(0,1fr)_20rem]" : ""}`}>
        <div className="min-w-0">
          <div className={gridClass}>
            {program.deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} mode={mode} />
            ))}
          </div>

          {chrome.showOperateAside && (
            <p className="cover-ops no-print">Bandeja · {inboxPhrase(program.inboxUnclassified)}</p>
          )}
        </div>

        {showRail && (
          <aside className="no-print min-w-0 space-y-4">
            <AttentionPanel items={attention} />
            <ActivityFeed items={feed} mode={mode} variant="rail" />
          </aside>
        )}
      </div>

      {showRail ? (
        <ProposalQueue
          configured={isOpenRouterConfigured()}
          deals={program.deals.map((deal) => ({ slug: deal.slug, name: deal.name, id: deal.id }))}
          proposals={proposals}
        />
      ) : null}
    </AppShell>
  );
}

function inboxPhrase(n: number) {
  if (n === 0) return "nada por classificar";
  if (n === 1) return "1 sem classificar";
  return `${n} sem classificar`;
}

/** Fora de `/deals/`, a capa leva o deal na query. Sem slug, o href fica como está. */
function hrefOnCover(href: string, slug: string | null) {
  if (!slug || href.startsWith("/deals/") || href.startsWith("http")) return href;
  const hashAt = href.indexOf("#");
  const base = hashAt === -1 ? href : href.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : href.slice(hashAt);
  const [path, query = ""] = base.split("?");
  const params = new URLSearchParams(query);
  params.set("deal", slug);
  return `${path}?${params.toString()}${hash}`;
}
