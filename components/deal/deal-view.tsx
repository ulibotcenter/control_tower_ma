import { folderUrl } from "@/lib/constants";
import { canSeePriceAndThesis } from "@/lib/visibility";
import type { DealBundle, MeetingMode } from "@/lib/types";
import { Term } from "@/components/ui/term";
import { DriveLink } from "@/components/ui/drive-link";
import { SemaphoreBadge } from "@/components/ui/semaphore";
import { Timeline } from "./timeline";
import { SectionNav } from "./section-nav";
import { ThesisPrice } from "./thesis-price";
import { WorkstreamGrid } from "./workstream-grid";
import { ChecklistTable } from "./checklist-table";
import { ActionList, CapTable, DocsList, MetricsGrid, NotesList, RiskList } from "./lists";

export function DealView({ bundle, mode }: { bundle: DealBundle; mode: MeetingMode }) {
  const { deal } = bundle;
  const hideThesis = !canSeePriceAndThesis(mode);
  const frozen = deal.status === "standby";

  return (
    <article>
      {frozen && (
        <p className="mb-4 stamp text-wait">
          {mode === "target"
            ? "Sem andamento neste momento"
            : "Congelada · não pressionar · Loopert primeiro"}
        </p>
      )}

      <header id="visao" className="mb-6">
        <p className="kicker">
          Deal {deal.priority} · {deal.city}
          {deal.since ? ` · desde ${deal.since}` : ""}
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="serif text-4xl text-navy sm:text-5xl">{deal.name}</h1>
          <SemaphoreBadge tone={deal.health} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {deal.legalName} · {deal.cnpj}
        </p>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed">
          {mode === "target" ? deal.headlineTarget : deal.headline}
        </p>
        {deal.product && <p className="mt-2 text-sm text-muted">{deal.product}</p>}
        <p className="mt-3 text-sm">
          Pasta no Drive ·{" "}
          <DriveLink href={folderUrl(deal.driveFolderId)} kind="folder">
            {deal.driveFolderLabel}
          </DriveLink>
        </p>
      </header>

      <SectionNav
        hideThesis={hideThesis}
        hasThesis={bundle.thesis.length > 0 || bundle.prices.length > 0}
      />

      <section className="mb-10">
        <p className="kicker">Linha do tempo</p>
        <h2 className="serif mb-4 text-2xl text-navy">Onde estamos</h2>
        <Timeline items={bundle.milestones} mode={mode} />
      </section>

      {!hideThesis && (bundle.thesis.length > 0 || bundle.prices.length > 0) && (
        <div className="mb-10">
          <ThesisPrice thesis={bundle.thesis} prices={bundle.prices} hidden={false} />
        </div>
      )}

      {bundle.capTable.length > 0 && mode !== "target" && (
        <section className="mb-10">
          <p className="kicker">Quadro societário</p>
          <h2 className="serif mb-3 text-2xl text-navy">
            {deal.slug === "radio-health" ? "Cap verbal — a confirmar" : "Cap oficial"}
          </h2>
          <CapTable rows={bundle.capTable} />
        </section>
      )}

      <section id="checklist" className="mb-10">
        <p className="kicker">Due diligence</p>
        <h2 className="serif mb-2 text-2xl text-navy">Checklist</h2>
        <p className="mb-4 max-w-2xl text-sm text-muted">
          Arquivo novo no Drive não conclui item. Um &quot;NDA assinado.pdf&quot; pode ser minuta. Só
          entra no semáforo depois da classificação humana.
        </p>
        <ChecklistTable items={bundle.checklist} />
      </section>

      <div className="mb-10">
        <WorkstreamGrid bundle={bundle} mode={mode} />
      </div>

      <section id="riscos" className="mb-10">
        <p className="kicker">O que trava</p>
        <h2 className="serif mb-4 text-2xl text-navy">Riscos e issues</h2>
        <RiskList items={bundle.risks} />
      </section>

      <section id="acoes" className="mb-10">
        <p className="kicker">Próximos passos</p>
        <h2 className="serif mb-4 text-2xl text-navy">Ações</h2>
        <ActionList items={bundle.actions} />
      </section>

      <section id="docs" className="mb-10">
        <p className="kicker">Data room</p>
        <h2 className="serif mb-2 text-2xl text-navy">Documentos-chave</h2>
        <p className="mb-4 text-sm text-muted">
          Sempre abre o Google Drive em nova aba. A torre não hospeda o arquivo.
        </p>
        <DocsList items={bundle.documents} />
      </section>

      <section id="indicadores" className="mb-10">
        <p className="kicker">Números do corte {deal.slug === "loopert" ? "14/08/2026" : ""}</p>
        <h2 className="serif mb-2 text-2xl text-navy">Indicadores</h2>
        <p className="mb-4 text-sm text-muted">
          {mode === "target"
            ? "Só números já formalizados. Dado ausente = a confirmar."
            : <>
                Só o que está na história oficial. Dado ausente = a confirmar. Não há{" "}
                <Term id="loi">LOI</Term> nem <Term id="spa">SPA</Term>.
              </>}
        </p>
        <MetricsGrid items={bundle.metrics} />
      </section>

      {bundle.people.length > 0 && mode !== "target" && (
        <section className="mb-10">
          <p className="kicker">Pessoas</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {bundle.people.map((p) => (
              <li key={p.name} className="paper px-4 py-3 text-sm">
                <span className="font-semibold text-navy">{p.name}</span>
                <span className="text-muted"> · {p.role}</span>
                <p className="mt-1 text-muted">{p.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <NotesList items={bundle.notes} />
    </article>
  );
}
