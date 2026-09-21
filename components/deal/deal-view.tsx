import Link from "next/link";
import { folderUrl } from "@/lib/constants";
import { canSeePriceAndThesis } from "@/lib/visibility";
import { semaphoreLabelFor, semaphoreShortFor, TARGET_COPY, viewChrome } from "@/lib/mode-meta";
import { blockersFrom, type PillarView } from "@/lib/data/pillar-view";
import { pillarOfDealPhase } from "@/lib/pillars";
import type { TemaSlug } from "@/lib/data/temas";
import type { DealBundle, MeetingMode, Semaphore } from "@/lib/types";
import { ThemePanel, ThemeRail } from "./theme-rail";
import { Term } from "@/components/ui/term";
import { WithTerms } from "@/components/ui/with-terms";
import { DriveLink } from "@/components/ui/drive-link";
import { Timeline } from "./timeline";
import { ThesisPrice } from "./thesis-price";
import { CapTable, MetricsGrid, NotesList } from "./lists";
import { Freshness } from "@/components/ui/freshness";

const OPL_CAP = 6;

export function DealView({
  bundle,
  pillars,
  mode,
  present = false,
  tema = null,
}: {
  bundle: DealBundle;
  pillars: PillarView[];
  mode: MeetingMode;
  present?: boolean;
  tema?: TemaSlug | null;
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
  const showDrive = !present && !target;
  const travas = blockersFrom(bundle.risks, bundle.checklist, 3, bundle.actions);
  const hereSlug = pillarOfDealPhase(deal.phase);
  const abrir = pillars.find((p) => p.slug === hereSlug) ?? pillars[0] ?? null;
  const opl = pontosEmAberto(bundle);

  return (
    <article className={present ? "present-deck" : undefined}>
      <div className="war-top">
        <header id="visao">
          {!target && <p className="kicker">Deal {deal.priority}</p>}
          <h1 className="deal-name">{deal.name}</h1>
          <p className="deal-city">
            {deal.city}
            {!present && deal.since ? ` · desde ${deal.since}` : ""}
          </p>
          {frozen && (
            <p className="stamp mt-2 text-wait">
              {mode === "target" ? "Em análise" : "Em análise · em paralelo"}
            </p>
          )}
          {!present && (
            <p className="deal-legal">
              {deal.legalName} · {deal.cnpj}
            </p>
          )}
          {chrome.showProductLine && deal.product && (
            <p className="deal-product">{deal.product}</p>
          )}
        </header>

        <dl className="war-situation paper">
          <div>
            <dt>{TARGET_COPY.phaseLabel}</dt>
            <dd>
              <WithTerms text={deal.phaseLabel} interactive={false} />
            </dd>
          </div>
          <div>
            <dt>{TARGET_COPY.healthLabel}</dt>
            <dd>
              <span className={`health-chip is-${deal.health as Semaphore}`}>
                <span className={`dot dot-${deal.health as Semaphore}`} aria-hidden />
                {semaphoreLabelFor(mode, deal.health)}
              </span>
            </dd>
          </div>
          <div>
            <dt>{TARGET_COPY.nextMilestoneLabel}</dt>
            <dd>
              <WithTerms
                text={target ? deal.nextMilestoneTarget : deal.nextMilestone}
                interactive={false}
              />
            </dd>
          </div>
        </dl>

        <div className={`war-trava paper${travas.length > 0 ? " trava-band" : ""}`}>
          <p className={travas.length > 0 ? "trava-kicker" : "war-trava-calm"}>O que trava</p>
          {travas.length === 0 ? (
            <p className="war-trava-empty">Nada trava o deal hoje.</p>
          ) : (
            <ul>
              {travas.map((t) => (
                <li key={t.id}>
                  <WithTerms text={t.line} interactive={false} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {!present && (
        <p className="war-headline">
          <WithTerms text={target ? deal.headlineTarget : deal.headline} />
        </p>
      )}

      {(present ? bundle.metrics.length > 0 : true) && (
        <section id="indicadores" className="war-block">
          <h2 className="war-label">Indicadores</h2>
          {!present && <Freshness trust={review ? "review" : "firm"} mode={mode} />}
          {!present && (
            <p className="war-note">
              {target ? (
                "Só números já formalizados. Dado ausente = a confirmar."
              ) : (
                <>
                  Só o que está na história oficial. Dado ausente = a confirmar. Não há{" "}
                  <Term id="loi">LOI</Term> nem <Term id="spa">SPA</Term>.
                </>
              )}
            </p>
          )}
          <MetricsGrid items={bundle.metrics} mode={mode} />
        </section>
      )}

      <section className="war-block">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 className="war-label">Onde estamos</h2>
          <p className="text-[12px] text-muted">
            {bundle.milestones.filter((m) => m.status === "done").length} de{" "}
            {bundle.milestones.length} marcos concluídos
          </p>
        </div>
        {!present && <Freshness trust={review ? "review" : "firm"} mode={mode} />}
        <div className="mt-2">
          <Timeline items={bundle.milestones} mode={mode} compact />
        </div>
      </section>

      <section id="pilares" className="war-block war-pillars">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="war-label">Pilares</h2>
          {abrir && (
            <Link href={`/deals/${deal.slug}/${abrir.slug}`} className="war-open-pillar">
              abrir pilar
              <span className="sr-only"> {abrir.name}</span>
            </Link>
          )}
        </div>
        <ol className="pillar-strip" aria-label="Pilares do processo">
          {pillars.map((pilar) => {
            const here = hereSlug === pilar.slug;
            const saude = semaphoreShortFor(mode, pilar.health);
            return (
              <li key={pilar.slug}>
                <Link
                  href={`/deals/${deal.slug}/${pilar.slug}`}
                  className={`pillar-pip is-${pilar.health}${here ? " is-here" : ""}`}
                  aria-current={here ? "true" : undefined}
                  title={`${pilar.order}. ${pilar.name} · ${saude}`}
                >
                  <span className="pillar-pip-top">
                    <span className={`dot dot-${pilar.health}`} aria-hidden />
                    <span className="pillar-pip-ord">{pilar.order}</span>
                  </span>
                  <span className="pillar-pip-name">{pilar.short}</span>
                  <span className="sr-only">{here ? `${saude}. Estamos aqui.` : saude}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {!present && <ThemeRail bundle={bundle} tema={tema} />}
      {!present && tema ? <ThemePanel bundle={bundle} tema={tema} target={target} /> : null}

      {showDrive && (
        <section id="documentos" className="war-block">
          <h2 className="war-label">Data room</h2>
          <p className="mt-1 text-sm">
            <DriveLink href={folderUrl(deal.driveFolderId)} kind="folder">
              {deal.driveFolderLabel}
            </DriveLink>
          </p>
        </section>
      )}

      {target && showNotes && <NotesList items={bundle.notes} />}

      {!present && (
        <section id="opl" className="war-block war-opl">
          <h2 className="war-label">Pontos em aberto</h2>
          <p className="war-note">A lista editável entra no bloco 5.</p>
          {opl.length > 0 && (
            <ul className="war-opl-list">
              {opl.slice(0, OPL_CAP).map((item) => (
                <li key={item.id}>
                  <WithTerms text={item.text} interactive={false} />
                </li>
              ))}
            </ul>
          )}
          {opl.length > OPL_CAP && (
            <p className="war-note">+{opl.length - OPL_CAP} já registrados no deal.</p>
          )}
        </section>
      )}

      {showElevaRoom && (
        <section id="tese" className="eleva-room mb-4">
          <p className="eleva-room-label">Sala Eleva</p>
          <h2 className="serif mt-1 text-[22px] leading-tight text-navy">Leitura interna</h2>
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
    </article>
  );
}

/** Só o que o bundle deste modo já deixou visível. Sem item novo. */
function pontosEmAberto(bundle: DealBundle) {
  const actions = bundle.actions
    .filter((a) => a.status === "open" || a.status === "late")
    .map((a) => ({ id: a.id, text: a.title }));
  const checks = bundle.checklist
    .filter((c) => c.status === "aberto" || c.status === "em_andamento" || c.status === "bloqueado")
    .map((c) => ({ id: c.id, text: c.title }));
  const reds = bundle.risks
    .filter((r) => r.severity === "red")
    .map((r) => ({ id: r.id, text: r.title }));
  return [...actions, ...checks, ...reds];
}
