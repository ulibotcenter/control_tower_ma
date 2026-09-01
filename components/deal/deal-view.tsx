import { folderUrl } from "@/lib/constants";
import { canSeePriceAndThesis } from "@/lib/visibility";
import { TARGET_COPY, semaphoreLabelFor, viewChrome } from "@/lib/mode-meta";
import type { DealBundle, MeetingMode } from "@/lib/types";
import { Term } from "@/components/ui/term";
import { WithTerms } from "@/components/ui/with-terms";
import { DriveLink } from "@/components/ui/drive-link";
import { SemaphoreBadge } from "@/components/ui/semaphore";
import { ExportPdfButton } from "@/components/export/export-pdf-button";
import { Timeline } from "./timeline";
import { SectionNav } from "./section-nav";
import { ThesisPrice } from "./thesis-price";
import { WorkstreamGrid } from "./workstream-grid";
import { ChecklistTable } from "./checklist-table";
import { CapTable, MetricsGrid, NotesList } from "./lists";
import { DealSwitcher } from "./deal-switcher";
import { DealWorkbench } from "./deal-workbench";
import { Freshness } from "@/components/ui/freshness";

export function DealView({
  bundle,
  mode,
  deals,
  onlyDeal = null,
  present = false,
}: {
  bundle: DealBundle;
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
            <h1 className="serif mt-1 text-4xl text-navy sm:text-5xl">{deal.name}</h1>
            <p className="mt-1 text-sm text-muted">
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

        <p className="mt-6 max-w-3xl text-lg leading-relaxed">
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

      <SectionNav
        mode={mode}
        hideThesis={!showElevaRoom}
        present={present}
      />

      {/* Ordem da leitura: onde estamos, o que falta entregar, o que trava,
          quem faz o quê. A leitura interna vai toda para o fim da página. */}
      <section className="mb-14">
        <h2 className="serif mb-1 text-2xl text-navy">Onde estamos</h2>
        <Freshness trust={review ? "review" : "firm"} />
        <div className="mt-4">
          <Timeline items={bundle.milestones} mode={mode} />
        </div>
      </section>

      {chrome.showChecklist && (
        <section id="checklist" className="mb-14">
          <h2 className="serif mb-1 text-2xl text-navy">
            {target ? TARGET_COPY.documentsTitle : "Checklist"}
          </h2>
          <Freshness trust="review" />
          <p className="mb-4 mt-2 max-w-2xl text-sm text-muted">
            {target
              ? "Documentos pedidos. Um arquivo entregue não encerra o item — ele passa por conferência."
              : <>
                  Arquivo novo no Drive não conclui item. Um &quot;<Term id="nda">NDA</Term>{" "}
                  assinado.pdf&quot; pode ser <Term id="minuta">minuta</Term>.
                </>}
          </p>
          <ChecklistTable items={bundle.checklist} />
        </section>
      )}

      <DealWorkbench
        actions={bundle.actions}
        risks={bundle.risks}
        documents={bundle.documents}
        mode={mode}
        present={present}
        showSearch={chrome.showSearch}
        showDocs={chrome.showDocs}
        compact={chrome.compactBoards}
      />

      {chrome.showWorkstreams && (
        <div id="workstreams" className="mb-14">
          <WorkstreamGrid bundle={bundle} mode={mode} />
        </div>
      )}

      {!present && (
        <section id="indicadores" className="mb-14">
          <h2 className="serif mb-1 text-2xl text-navy">Indicadores</h2>
          <Freshness trust={review ? "review" : "firm"} />
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
          <h2 className="serif text-2xl text-navy">Sala da Eleva</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Leitura interna: tese, preço, quadro societário e notas. Não é fato formal da
            operação e não vai para a tela de reunião com o alvo.
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
              <Freshness trust={deal.slug === "radio-health" ? "review" : "firm"} />
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
