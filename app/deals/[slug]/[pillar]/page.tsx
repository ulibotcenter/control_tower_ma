import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { DealSwitcher } from "@/components/deal/deal-switcher";
import { ChecklistTable } from "@/components/deal/checklist-table";
import { DocsList } from "@/components/deal/lists";
import { ActionBoard } from "@/components/deal/action-board";
import { RisksBoard } from "@/components/deal/risks-board";
import { EmptyState } from "@/components/ui/empty-state";
import { getDealBundle, getDealOptions } from "@/lib/data/provider";
import {
  ddSubgroupCounts,
  filterBySubgroup,
  getPillarView,
  getPillarViews,
} from "@/lib/data/pillar-view";
import { isDealAllowed, lockedDeal } from "@/lib/meeting";
import { semaphoreLabelFor, TARGET_COPY } from "@/lib/mode-meta";
import { getMeeting } from "@/lib/mode";
import {
  isDdSubgroup,
  isPillarSlug,
  pillarForLegacyWorkstream,
  pillarOf,
  PILLAR_BY_SLUG,
} from "@/lib/pillars";
import type { MeetingMode, Semaphore, Workstream } from "@/lib/types";

/**
 * Um pilar do processo. A rota é a mesma que servia as frentes de trabalho:
 * `/deals/<deal>/legal` continua respondendo e manda para o pilar
 * equivalente, com o subgrupo já selecionado quando existe.
 */
export default async function PillarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; pillar: string }>;
  searchParams: Promise<{ frente?: string }>;
}) {
  const { slug, pillar } = await params;

  // Antes de qualquer busca: URL antiga de frente vai para o pilar dela.
  // Aqui o redirect ainda sai como 307; depois do primeiro await o shell já
  // foi transmitido e o salto viraria coisa do cliente.
  if (!isPillarSlug(pillar)) {
    const legado = pillarForLegacyWorkstream(pillar);
    if (!legado) notFound();
    const query = legado.subgroup ? `?frente=${legado.subgroup}` : "";
    redirect(`/deals/${slug}/${legado.pillar}${query}`);
  }

  const { frente } = await searchParams;
  const meeting = await getMeeting();
  if (!isDealAllowed(meeting, slug)) redirect(`/deals/${meeting.targetDeal}`);
  const mode = meeting.mode;
  const bundle = await getDealBundle(slug, mode);
  if (!bundle) notFound();

  const view = getPillarView(bundle, pillar);
  const meta = PILLAR_BY_SLUG[pillar];
  const sub = isDdSubgroup(frente) ? frente : null;
  const chips = pillar === "dd" ? ddSubgroupCounts(view) : [];

  const checklist = filterBySubgroup(view.checklist, sub);
  const risks = filterBySubgroup(view.risks, sub);
  const actions = filterBySubgroup(view.actions, sub);
  const documents = filterBySubgroup(view.documents, sub);
  const vazio = checklist.length + risks.length + actions.length + documents.length === 0;

  return (
    <AppShell>
      <div className="no-print">
        <DealSwitcher
          current={slug}
          deals={getDealOptions({ onlyDeal: lockedDeal(meeting) })}
          onlyDeal={lockedDeal(meeting)}
        />
      </div>

      <p className="no-print text-[13px]">
        <Link href={`/deals/${slug}`} className="text-muted hover:text-brand">
          ← {bundle.deal.name}
        </Link>
      </p>

      <header className="mt-3">
        <p className="kicker">Pilar {meta.order} de 6</p>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="serif text-[28px] leading-tight text-navy sm:text-[32px]">{meta.name}</h1>
          <span className="flex shrink-0 items-center gap-2 text-[13px] text-navy">
            <span className={`dot dot-${view.health as Semaphore}`} aria-hidden />
            {semaphoreLabelFor(mode, view.health)}
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted">
          {resumoDoPilar(bundle.workstreams, pillar, mode)}
        </p>
      </header>

      {chips.length > 0 && (
        <nav className="chip-row mt-5 no-print" aria-label="Subgrupos da due diligence">
          <Link href={`/deals/${slug}/dd`} className={`chip${sub ? "" : " is-on"}`}>
            Tudo
            <span className="chip-count">{view.total}</span>
          </Link>
          {chips.map((c) => (
            <Link
              key={c.slug}
              href={`/deals/${slug}/dd?frente=${c.slug}`}
              className={`chip${sub === c.slug ? " is-on" : ""}`}
            >
              {c.name}
              <span className="chip-count">{c.count}</span>
            </Link>
          ))}
        </nav>
      )}

      {vazio ? (
        <div className="mt-8">
          <EmptyState
            title="Nada neste pilar por enquanto"
            hint="Quando um documento for classificado ou uma pendência entrar aqui, ela aparece nesta página."
          />
        </div>
      ) : (
        <>
          {checklist.length > 0 && (
            <section className="mt-10">
              <h2 className="serif mb-3 text-[22px] leading-tight text-navy">
                {mode === "target" ? TARGET_COPY.documentsTitle : "Pendências"}
              </h2>
              <ChecklistTable items={checklist} />
            </section>
          )}

          {risks.length > 0 && (
            <section className="mt-10">
              <h2 className="serif mb-3 text-[22px] leading-tight text-navy">
                {mode === "target" ? "Pontos em aberto" : "Riscos"}
              </h2>
              <RisksBoard items={risks} mode={mode} />
            </section>
          )}

          {actions.length > 0 && (
            <section className="mt-10">
              <h2 className="serif mb-3 text-[22px] leading-tight text-navy">Ações</h2>
              <ActionBoard items={actions} />
            </section>
          )}

          {documents.length > 0 && (
            <section className="mt-10">
              <h2 className="serif mb-3 text-[22px] leading-tight text-navy">Documentos</h2>
              <DocsList items={documents} />
            </section>
          )}

          {view.unfiled > 0 && !sub && (
            <p className="mt-6 text-[13px] text-muted">
              {view.unfiled} {view.unfiled === 1 ? "item ainda sem frente" : "itens ainda sem frente"}{" "}
              nesta lista. Classificar a frente coloca cada um no seu subgrupo.
            </p>
          )}
        </>
      )}

      <nav className="mt-12 border-t border-line pt-5 no-print" aria-label="Outros pilares">
        <p className="text-[13px] text-muted">Outros pilares</p>
        <ul className="chip-row mt-2">
          {getPillarViews(bundle)
            .filter((p) => p.slug !== pillar)
            .map((p) => (
              <li key={p.slug}>
                <Link href={`/deals/${slug}/${p.slug}`} className="chip">
                  <span className={`dot dot-${p.health as Semaphore}`} aria-hidden />
                  {p.short}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </AppShell>
  );
}

/**
 * Resumo do pilar: costura os resumos das frentes que caem nele. Texto do
 * seed, escolhido pelo modo — nada escrito aqui.
 */
function resumoDoPilar(workstreams: Workstream[], pillar: string, mode: MeetingMode) {
  const partes = workstreams
    .filter((w) => pillarOf({ workstreamSlug: w.slug }) === pillar)
    .map((w) => (mode === "target" ? w.summaryTarget : w.summary))
    .filter(Boolean);
  if (partes.length === 0) return "Sem leitura registrada para este pilar neste corte.";
  return partes.slice(0, 2).join(" ");
}
