import { AppShell } from "@/components/shell/app-shell";
import { AttentionPanel } from "@/components/home/attention-panel";
import { DealCard } from "@/components/home/deal-card";
import { ActivityFeed } from "@/components/home/activity-feed";
import { WithTerms } from "@/components/ui/with-terms";
import { focusSlugFromQuery } from "@/components/shell/focus-deal";
import { blockersFrom, getPillarViews } from "@/lib/data/pillar-view";
import { getActivity, getAttentionItems, getDealBundle, getProgram } from "@/lib/data/provider";
import { MODE_META, TARGET_COPY, viewChrome } from "@/lib/mode-meta";
import { getLockedDeal, getMode } from "@/lib/mode";
import { pillarOfDealPhase } from "@/lib/pillars";
import { getPresent } from "@/lib/present";
import type { DealBundle } from "@/lib/types";
import { canSeeDecisions } from "@/lib/visibility";
import { Freshness } from "@/components/ui/freshness";
import { DriveSyncStamp } from "@/components/shell/drive-sync-stamp";
import { getDriveSyncedAt } from "@/lib/data/store";

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
  const showDrive = mode !== "target" && !present;
  const showDecisions = canSeeDecisions(mode) !== "hidden" && !present;

  // A faixa sai de getPillarViews (ordem e nomes do corte, não uma lista na capa).
  // Em aberto = ações não concluídas + checagens abertas + riscos vermelhos.
  const cards = await Promise.all(
    program.deals.map(async (deal) => {
      const bundle = await getDealBundle(deal.slug, mode);
      const pillars = bundle ? getPillarViews(bundle) : [];
      const blockers = bundle ? blockersFrom(bundle.risks, bundle.checklist, 3, bundle.actions) : [];
      const counts = bundle ? contarEmAberto(bundle) : null;
      const trava =
        blockers.length > 0
          ? blockers.map((item) => ({ id: item.id, line: item.line }))
          : deal.topReds.map((line, index) => ({ id: `${deal.id}-red-${index}`, line }));
      return {
        deal,
        pillars,
        trava,
        redCount: counts?.redRisks ?? deal.redCount,
        emAberto: counts ? counts.emAberto : null,
        openActions: counts ? counts.openActions : null,
        openChecks: counts ? counts.openChecks : null,
        hereSlug: pillarOfDealPhase(deal.phase),
      };
    }),
  );

  const slugOf = new Map(program.deals.map((deal) => [deal.id, deal.slug]));
  const attention = showRail ? getAttentionItems(mode, { onlyDeal }) : [];
  const activity = showRail ? await getActivity(mode, 8, { onlyDeal }) : [];
  const feed = activity.map((item) => ({
    ...item,
    href: hrefOnCover(item.href, item.dealId ? (slugOf.get(item.dealId) ?? null) : null),
  }));

  const several = cards.length > 1;
  const gridClass = `cover-grid${several ? " has-lead" : ""}${present ? " is-deck" : ""}`;
  const driveSyncedAt = showRail ? await getDriveSyncedAt().catch(() => null) : null;

  return (
    <AppShell focusSlug={focusSlugFromQuery(dealQuery)}>
      <header className="cover-intro max-w-2xl">
        <p className="kicker">{target ? TARGET_COPY.homeKicker : "Portfólio"}</p>
        <h1 className="cover-title">{target ? TARGET_COPY.homeTitle : "Operações"}</h1>
        <Freshness mode={mode} />
        {showRail ? <DriveSyncStamp syncedAt={driveSyncedAt} className="drive-sync-stamp cover-sync-stamp" /> : null}
        {target && (
          <p className="mt-3 text-[15px] leading-relaxed">
            <WithTerms text={MODE_META.target.homeLead} />
          </p>
        )}
      </header>

      <div className={`mt-8 grid gap-8 ${showRail ? "xl:grid-cols-[minmax(0,1fr)_20rem]" : ""}`}>
        <div className="min-w-0">
          <div className={gridClass}>
            {several && cards[0] ? (
              <>
                <DealCard
                  key={cards[0].deal.id}
                  {...cards[0]}
                  mode={mode}
                  weight="lead"
                  showDrive={showDrive}
                  showDecisions={showDecisions}
                />
                <div className="cover-rest">
                  {cards.slice(1).map((card) => (
                    <DealCard
                      key={card.deal.id}
                      {...card}
                      mode={mode}
                      weight="second"
                      showDrive={showDrive}
                      showDecisions={showDecisions}
                    />
                  ))}
                </div>
              </>
            ) : (
              cards.map((card) => (
                <DealCard
                  key={card.deal.id}
                  {...card}
                  mode={mode}
                  weight="only"
                  showDrive={showDrive}
                  showDecisions={showDecisions}
                />
              ))
            )}
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
    </AppShell>
  );
}

function contarEmAberto(bundle: DealBundle) {
  const openActions = bundle.actions.filter((item) => item.status === "open" || item.status === "late").length;
  const openChecks = bundle.checklist.filter(
    (item) => item.status === "aberto" || item.status === "em_andamento",
  ).length;
  const redRisks = bundle.risks.filter((item) => item.severity === "red").length;
  return { openActions, openChecks, redRisks, emAberto: openActions + openChecks + redRisks };
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
