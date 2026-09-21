import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { ChecklistTable } from "@/components/deal/checklist-table";
import { DocsList } from "@/components/deal/lists";
import { ActionBoard } from "@/components/deal/action-board";
import { RisksBoard } from "@/components/deal/risks-board";
import { getDealBundle } from "@/lib/data/provider";
import {
  blockersFrom,
  ddOutsideSubgroups,
  ddSubgroupCounts,
  filterBySubgroup,
  firstOpenAction,
  getPillarViews,
} from "@/lib/data/pillar-view";
import { isDealAllowed } from "@/lib/meeting";
import { semaphoreLabelFor, TARGET_COPY } from "@/lib/mode-meta";
import { WithTerms } from "@/components/ui/with-terms";
import { EmptyState } from "@/components/ui/empty-state";
import { getMeeting } from "@/lib/mode";
import {
  isDdSubgroup,
  isPillarSlug,
  pillarForLegacyWorkstream,
  pillarOf,
  pillarOfDealPhase,
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

  const pillars = getPillarViews(bundle);
  const view = pillars.find((p) => p.slug === pillar)!;
  const meta = PILLAR_BY_SLUG[pillar];
  const sub = isDdSubgroup(frente) ? frente : null;
  const chips = pillar === "dd" ? ddSubgroupCounts(view) : [];
  const fora = pillar === "dd" ? ddOutsideSubgroups(view) : 0;

  const checklist = filterBySubgroup(view.checklist, sub);
  const risks = filterBySubgroup(view.risks, sub);
  const actions = filterBySubgroup(view.actions, sub);
  const documents = filterBySubgroup(view.documents, sub);
  const vazio = checklist.length + risks.length + actions.length + documents.length === 0;
  const travas = blockersFrom(risks, checklist, 3, actions);
  const proximo = firstOpenAction(actions);
  const pendencias = checklist.filter((c) => c.status !== "concluido");
  const target = mode === "target";

  return (
    <AppShell
      nav={{
        slug: bundle.deal.slug,
        name: bundle.deal.name,
        phasePillar: pillarOfDealPhase(bundle.deal.phase),
        pillars: pillars.map((p) => ({
          slug: p.slug,
          order: p.order,
          short: p.short,
          health: p.health,
        })),
      }}
    >
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
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
          {resumoDoPilar(bundle.workstreams, pillar, mode)}
        </p>
      </header>

      <dl
        className={`paper mt-5 grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0${travas.length > 0 ? " trava-band" : ""}`}
      >
        <div className="px-4 py-3">
          <dt className="text-[12px] font-semibold tracking-tight text-muted">
            O que trava este pilar
          </dt>
          <dd className="mt-1">
            {travas.length === 0 ? (
              <p className="text-[15px] leading-snug text-navy">Nada trava este pilar hoje.</p>
            ) : (
              <ul className="space-y-0.5">
                {travas.map((t) => (
                  <li key={t.id} className="text-[15px] font-medium leading-snug text-alert">
                    <WithTerms text={t.line} interactive={false} />
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-[12px] font-semibold tracking-tight text-muted">Próximo passo</dt>
          <dd className="mt-1 text-[15px] leading-snug text-navy">
            {proximo ? (
              <>
                <span className="font-medium">
                  <WithTerms text={proximo.title} interactive={false} />
                </span>
                {proximo.owner ? (
                  <span className="mt-0.5 block text-[13px] text-muted">{proximo.owner}</span>
                ) : null}
              </>
            ) : (
              "Nenhum próximo passo neste pilar."
            )}
          </dd>
        </div>
      </dl>

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

      {chips.length > 0 && fora > 0 && !sub && (
        <p className="mt-2 text-[12px] text-muted no-print">
          {fora} {fora === 1 ? "item fica" : "itens ficam"} fora dos quatro subgrupos
          (comercial, operacional ou ainda sem frente) e só {fora === 1 ? "aparece" : "aparecem"} em
          Tudo.
        </p>
      )}

      {vazio ? (
        <p id="documentos" className="mt-8 text-[15px] text-muted">
          Ainda não iniciado. Quando um documento ou uma pendência entrar neste pilar, ele aparece
          aqui.
        </p>
      ) : (
        <>
          <div className="mt-8 grid gap-8 xl:grid-cols-3">
            <div className="pillar-col-trava min-w-0 space-y-8">
              {risks.length > 0 && (
                <section>
                  <h2 className="pillar-section-title">
                    {target ? "Pontos em aberto" : "Riscos"}
                  </h2>
                  <RisksBoard items={risks} mode={mode} />
                </section>
              )}

              {pendencias.length > 0 && (
                <section>
                  <h2 className="pillar-section-title">
                    {target ? TARGET_COPY.documentsTitle : "Pendências"}
                  </h2>
                  <ChecklistTable items={pendencias} />
                </section>
              )}

              {risks.length === 0 && pendencias.length === 0 && (
                <p className="text-[14px] text-muted">Nada trava este pilar hoje.</p>
              )}
            </div>

            <div className="pillar-col-acao min-w-0">
              <section>
                <h2 className="pillar-section-title">Ações</h2>
                {actions.length > 0 ? (
                  <ActionBoard items={actions} />
                ) : (
                  <EmptyState
                    title="Nenhuma ação nesta vista"
                    hint="Quando o board ou a Eleva definir um próximo passo, ele entra aqui com dono e prazo."
                  />
                )}
              </section>
            </div>

            <div id="documentos" className="pillar-col-doc min-w-0">
              <section>
                <h2 className="pillar-section-title">Documentos</h2>
                {documents.length > 0 ? (
                  <DocsList items={documents} />
                ) : (
                  <p className="text-[14px] text-muted">Nenhum documento neste pilar ainda.</p>
                )}
              </section>
            </div>
          </div>

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
          {pillars
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
  if (partes.length === 0) return "Ainda sem leitura registrada para este pilar.";
  return partes[0];
}
