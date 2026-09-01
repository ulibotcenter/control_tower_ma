import { folderUrl } from "@/lib/constants";
import { canSeePriceAndThesis } from "@/lib/visibility";
import { viewChrome } from "@/lib/mode-meta";
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

      <header id="visao" className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="kicker">
              Deal {deal.priority} · {deal.city}
              {deal.since ? ` · desde ${deal.since}` : ""}
            </p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
              <h1 className="serif text-4xl text-navy sm:text-5xl">{deal.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SemaphoreBadge tone={deal.health} />
            {present && (
              <div className="no-print hidden sm:block">
                <ExportPdfButton present pageLabel={deal.name} surface="page" />
              </div>
            )}
          </div>
        </div>
        <p className="mt-1 text-sm text-muted">
          {deal.legalName} · {deal.cnpj}
        </p>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed">
          <WithTerms text={mode === "target" ? deal.headlineTarget : deal.headline} />
        </p>
        {chrome.showProductLine && deal.product && (
          <p className="mt-2 text-sm text-muted">{deal.product}</p>
        )}
        {!present && mode !== "target" && (
          <p className="mt-3 text-sm">
            Pasta no Drive ·{" "}
            <DriveLink href={folderUrl(deal.driveFolderId)} kind="folder">
              {deal.driveFolderLabel}
            </DriveLink>
          </p>
        )}
      </header>

      <SectionNav
        hideThesis={hideThesis}
        hasThesis={bundle.thesis.length > 0 || bundle.prices.length > 0}
        present={present}
      />

      <section className="mb-10">
        <p className="kicker">Linha do tempo</p>
        <h2 className="serif mb-1 text-2xl text-navy">Onde estamos</h2>
        <Freshness trust={review ? "review" : "firm"} />
        <div className="mt-4">
          <Timeline items={bundle.milestones} mode={mode} />
        </div>
      </section>

      {!hideThesis && (bundle.thesis.length > 0 || bundle.prices.length > 0) && (
        <div className="mb-10">
          <ThesisPrice thesis={bundle.thesis} prices={bundle.prices} hidden={false} />
        </div>
      )}

      {chrome.showCap && bundle.capTable.length > 0 && (
        <section className="mb-10">
          <p className="kicker">Quadro societário</p>
          <h2 className="serif mb-1 text-2xl text-navy">
            {deal.slug === "radio-health" ? (
              <>
                <Term id="cap">Cap</Term> verbal — a confirmar
              </>
            ) : (
              <>
                <Term id="cap">Cap</Term> oficial
              </>
            )}
          </h2>
          <Freshness trust={deal.slug === "radio-health" ? "review" : "firm"} />
          <div className="mt-3">
            <CapTable rows={bundle.capTable} />
          </div>
        </section>
      )}

      {chrome.showChecklist && (
        <section id="checklist" className="mb-10">
          <p className="kicker">
            <Term id="dd">Due diligence</Term>
          </p>
          <h2 className="serif mb-1 text-2xl text-navy">Checklist</h2>
          <Freshness trust="review" />
          <p className="mb-4 mt-2 max-w-2xl text-sm text-muted">
            {mode === "target"
              ? "Itens formais pedidos ao alvo. Arquivo novo não conclui o item."
              : <>
                  Arquivo novo no Drive não conclui item. Um &quot;<Term id="nda">NDA</Term>{" "}
                  assinado.pdf&quot; pode ser <Term id="minuta">minuta</Term>.
                </>}
          </p>
          <ChecklistTable items={bundle.checklist} />
        </section>
      )}

      {chrome.showWorkstreams && (
        <div id="workstreams" className="mb-10">
          <WorkstreamGrid bundle={bundle} mode={mode} />
        </div>
      )}

      <DealWorkbench
        actions={bundle.actions}
        risks={bundle.risks}
        documents={bundle.documents}
        present={present}
        showSearch={chrome.showSearch}
        showDocs={chrome.showDocs}
        compact={chrome.compactBoards}
      />

      {!present && (
      <section id="indicadores" className="mb-10">
        <p className="kicker">Números do corte {deal.slug === "loopert" ? "14/08/2026" : ""}</p>
        <h2 className="serif mb-1 text-2xl text-navy">Indicadores</h2>
        <Freshness trust={review ? "review" : "firm"} />
        <p className="mb-4 mt-2 text-sm text-muted">
          {mode === "target"
            ? "Só números já formalizados. Dado ausente = a confirmar."
            : <>
                Só o que está na história oficial. Dado ausente = a confirmar. Não há{" "}
                <Term id="loi">LOI</Term> nem <Term id="spa">SPA</Term>.
              </>}
        </p>
        <MetricsGrid items={bundle.metrics} />
      </section>
      )}

      {chrome.showPeople && bundle.people.length > 0 && (
        <section className="mb-10">
          <p className="kicker">Pessoas</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
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
        </section>
      )}

      {chrome.showNotes && <NotesList items={bundle.notes} />}
    </article>
  );
}
