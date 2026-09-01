import { folderUrl } from "@/lib/constants";
import { canSeePriceAndThesis } from "@/lib/visibility";
import { TARGET_COPY, semaphoreLabelFor, viewChrome } from "@/lib/mode-meta";
import type { PillarView } from "@/lib/data/pillar-view";
import type { DealBundle, MeetingMode } from "@/lib/types";
import { Term } from "@/components/ui/term";
import { WithTerms } from "@/components/ui/with-terms";
import { DriveLink } from "@/components/ui/drive-link";
import { SemaphoreBadge } from "@/components/ui/semaphore";
import { ExportPdfButton } from "@/components/export/export-pdf-button";
import { Timeline } from "./timeline";
import { PillarGrid } from "./pillar-grid";
import { ThesisPrice } from "./thesis-price";
import { CapTable, MetricsGrid, NotesList } from "./lists";
import { DealSwitcher } from "./deal-switcher";
import { Freshness } from "@/components/ui/freshness";

export function DealView({
  bundle,
  pillars,
  mode,
  deals,
  onlyDeal = null,
  present = false,
}: {
  bundle: DealBundle;
  pillars: PillarView[];
  mode: MeetingMode;
  deals: { slug: string; name: string }[];
  onlyDeal?: string | null;
  present?: boolean;
}) {
  const { deal } = bundle;
  const chrome = viewChrome(mode, present);
  const hideThesis = !canSeePriceAndThesis(mode) || present;
  const frozen = deal.status === "standby";
  const review = deal.slug !== "loopert";
  const target = mode === "target";

  // Sala da Eleva: leitura interna, separada do que é fato formal da operação.
  // O que cada modo pode ver não muda aqui — só onde isso fica na página.
  const showThesis = !hideThesis && (bundle.thesis.length > 0 || bundle.prices.length > 0);
  const showCap = chrome.showCap && bundle.capTable.length > 0;
  const showPeople = chrome.showPeople && bundle.people.length > 0;
  const showNotes = chrome.showNotes && bundle.notes.length > 0;
  const showElevaRoom = !target && (showThesis || showCap || showPeople || showNotes);

  return (
    <article>
      <div className="no-print">
        <DealSwitcher current={deal.slug} deals={deals} onlyDeal={onlyDeal} />
      </div>
      {frozen && (
        <p className="mb-4 stamp text-wait">
          {mode === "target" ? "Em análise" : "Em análise · Loopert primeiro"}
        </p>
      )}

      <header id="visao" className="mb-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">
              {target ? "Operação" : `Deal ${deal.priority}`} · {deal.city}
              {deal.since ? ` · desde ${deal.since}` : ""}
            </p>
            {/* Silêncio tipográfico: um H1 de memo, não manchete de site. */}
            <h1 className="serif mt-1 text-[28px] leading-tight text-navy sm:text-[32px]">
              {deal.name}
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              {deal.legalName} · {deal.cnpj}
            </p>
          </div>
          {present && !target && (
            <div className="no-print hidden sm:block">
              <ExportPdfButton present pageLabel={deal.name} surface="page" />
            </div>
          )}
        </div>

        {/* Situação em 5 segundos: fase, semáforo e próximo marco, sem rolar. */}
        <dl className="paper mt-6 grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-3">
            <dt className="text-[12px] text-muted">{TARGET_COPY.phaseLabel}</dt>
            <dd className="mt-1 text-[15px] font-semibold leading-snug text-navy">
              <WithTerms text={deal.phaseLabel} interactive={false} />
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-[12px] text-muted">{TARGET_COPY.healthLabel}</dt>
            <dd className="mt-1 text-[15px] font-semibold leading-snug text-navy">
              <SemaphoreBadge tone={deal.health} label={semaphoreLabelFor(mode, deal.health)} />
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-[12px] text-muted">{TARGET_COPY.nextMilestoneLabel}</dt>
            <dd className="mt-1 text-[15px] leading-snug text-navy">
              <WithTerms
                text={target ? deal.nextMilestoneTarget : deal.nextMilestone}
                interactive={false}
              />
            </dd>
          </div>
        </dl>

        <p className="mt-5 max-w-3xl text-[16px] leading-relaxed">
          <WithTerms text={target ? deal.headlineTarget : deal.headline} />
        </p>
        {chrome.showProductLine && deal.product && (
          <p className="mt-2 text-sm text-muted">{deal.product}</p>
        )}
        {!present && !target && (
          <p className="mt-3 text-sm">
            Pasta no Drive ·{" "}
            <DriveLink href={folderUrl(deal.driveFolderId)} kind="folder">
              {deal.driveFolderLabel}
            </DriveLink>
          </p>
        )}
      </header>

      {/* A linha do tempo continua com os cinco marcos do corte. Não force
          seis: o pilar de Aprovações não tem marco próprio hoje. */}
      <section className="mb-10">
        <h2 className="serif mb-1 text-[22px] leading-tight text-navy">Onde estamos</h2>
        <Freshness trust={review ? "review" : "firm"} mode={mode} />
        <div className="mt-4">
          <Timeline items={bundle.milestones} mode={mode} />
        </div>
      </section>

      {/* O eixo da página é o processo, não a ferramenta: seis pilares. */}
      <section id="pilares" className="mb-10">
        <h2 className="serif mb-1 text-[22px] leading-tight text-navy">Pilares do processo</h2>
        <p className="mb-4 mt-1 max-w-2xl text-[13px] text-muted">
          {target
            ? "Cada pilar reúne os documentos pedidos e as pendências formais daquela etapa."
            : "Cada pilar reúne checklist, riscos, ações e documentos daquela etapa. O semáforo vem dos itens visíveis neste modo."}
        </p>
        <PillarGrid dealSlug={deal.slug} pillars={pillars} mode={mode} />
      </section>

      {!present && (
        <section id="indicadores" className="mb-10">
          <h2 className="serif mb-1 text-[22px] leading-tight text-navy">Indicadores</h2>
          <Freshness trust={review ? "review" : "firm"} mode={mode} />
          <p className="mb-4 mt-2 text-sm text-muted">
            {target
              ? "Só números já formalizados. Dado ausente = a confirmar."
              : <>
                  Só o que está na história oficial. Dado ausente = a confirmar. Não há{" "}
                  <Term id="loi">LOI</Term> nem <Term id="spa">SPA</Term>.
                </>}
          </p>
          <MetricsGrid items={bundle.metrics} mode={mode} />
        </section>
      )}

      {showElevaRoom && (
        <section id="tese" className="eleva-room mb-4">
          <p className="eleva-room-label">Sala Eleva</p>
          <h2 className="serif mt-1 text-[22px] leading-tight text-navy">
            Leitura interna
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] text-muted">
            Tese, preço, quadro societário, pessoas e notas. Não é fato formal da operação e não
            vai para a tela de reunião.
          </p>

          {showThesis && (
            <div className="mt-8">
              <ThesisPrice thesis={bundle.thesis} prices={bundle.prices} hidden={false} />
            </div>
          )}

          {showCap && (
            <div className="mt-10">
              <h3 className="serif mb-1 text-xl text-navy">
                {deal.slug === "radio-health" ? (
                  <>
                    <Term id="cap">Cap</Term> verbal — a confirmar
                  </>
                ) : (
                  <>
                    <Term id="cap">Cap</Term> oficial
                  </>
                )}
              </h3>
              <Freshness trust={deal.slug === "radio-health" ? "review" : "firm"} mode={mode} />
              <div className="mt-3">
                <CapTable rows={bundle.capTable} />
              </div>
            </div>
          )}

          {showPeople && (
            <div className="mt-10">
              <h3 className="serif mb-3 text-xl text-navy">Pessoas</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {bundle.people.map((p) => (
                  <li key={p.name} className="paper px-4 py-3 text-sm">
                    <span className="font-semibold text-navy">{p.name}</span>
                    <span className="text-muted"> · {p.role}</span>
                    <p className="mt-1 text-muted">
                      <WithTerms text={p.note} />
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showNotes && <NotesList items={bundle.notes} />}
        </section>
      )}

      {/* Fora da sala da Eleva: no modo Alvo só sobram notas marcadas como
          visíveis para o alvo. O filtro de visibilidade não muda aqui. */}
      {target && chrome.showNotes && <NotesList items={bundle.notes} />}
    </article>
  );
}
