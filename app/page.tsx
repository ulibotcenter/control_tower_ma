import { AppShell } from "@/components/shell/app-shell";
import { AttentionPanel } from "@/components/home/attention-panel";
import { BoardCard } from "@/components/home/board-card";
import { DealCard } from "@/components/home/deal-card";
import { Term } from "@/components/ui/term";
import { WithTerms } from "@/components/ui/with-terms";
import { folderUrl, DRIVE_FOLDERS } from "@/lib/constants";
import { alertEmail } from "@/lib/config";
import { getActivity, getAttentionItems, getProgram } from "@/lib/data/provider";
import { MODE_META, TARGET_COPY, viewChrome } from "@/lib/mode-meta";
import { getLockedDeal, getMode } from "@/lib/mode";
import { getPresent } from "@/lib/present";
import { DriveLink } from "@/components/ui/drive-link";
import { Freshness } from "@/components/ui/freshness";
import { ActivityFeed } from "@/components/home/activity-feed";
import { SemaphoreLegend } from "@/components/ui/legend";

export default async function HomePage() {
  const mode = await getMode();
  const onlyDeal = await getLockedDeal();
  const present = await getPresent();
  const [program, activity] = await Promise.all([
    getProgram(mode, { onlyDeal }),
    getActivity(mode, 8, { onlyDeal }),
  ]);
  const chrome = viewChrome(mode, present);
  const meta = MODE_META[mode];
  const target = mode === "target";

  // Trilho de trabalho: só existe quando a Eleva está operando a torre.
  // Some no Alvo e some na apresentação — ali a tela é leitura, não posto.
  const showRail = !target && !present;
  const attention = showRail ? getAttentionItems(mode, { onlyDeal }) : [];

  return (
    <AppShell>
      <header className="max-w-3xl">
        <p className="kicker">
          {target ? (
            TARGET_COPY.homeKicker
          ) : (
            <>
              Programa de <Term id="ma">M&amp;A</Term>
            </>
          )}
        </p>
        <h1 className="serif mt-1 text-[22px] leading-tight text-navy sm:text-[24px]">
          {target ? TARGET_COPY.homeTitle : "Programa"}
        </h1>
        <Freshness mode={mode} />
        <p className="mt-3 text-[15px] leading-relaxed">
          <WithTerms text={meta.homeLead} />
        </p>
        {meta.homeSub && !present && (
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            <WithTerms text={meta.homeSub} />
          </p>
        )}
      </header>

      <div
        className={`mt-8 grid gap-8 ${
          showRail ? "xl:grid-cols-[minmax(0,1fr)_20rem]" : "grid-cols-1"
        }`}
      >
        <div className="min-w-0">
          {/* O peso da home são as operações. Uma peça cada, lado a lado; com a
              reunião travada num alvo sobra uma, e ela ocupa a largura inteira. */}
          <div
            className={`grid items-stretch gap-4 ${
              program.deals.length > 1 ? "xl:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {program.deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} mode={mode} />
            ))}
          </div>

          <div className="mt-8">
            <BoardCard card={program.board} mode={mode} />
          </div>

          {!showRail && (
            <div className="mt-10">
              <ActivityFeed items={activity} mode={mode} />
            </div>
          )}

          {chrome.showOperateAside && (
            <aside className="no-print mt-10 paper p-4 text-[13px] leading-relaxed">
              <h2 className="text-[13px] font-semibold text-navy">Operação da torre</h2>
              <ul className="mt-2 space-y-1.5 text-muted">
                <li>
                  Drive:{" "}
                  {program.driveConfigured
                    ? "credencial presente — sync ainda é placeholder, não finja leitura."
                    : "API não configurada. Bandeja é manual."}{" "}
                  <DriveLink href={folderUrl(DRIVE_FOLDERS.root.id)} kind="folder">
                    Pasta raiz
                  </DriveLink>
                </li>
                <li>
                  Dados:{" "}
                  {program.dataBackend === "supabase"
                    ? "Supabase write (bandeja, classificação, decisões no Postgres)."
                    : "seed only — decisões novas não sobrevivem a deploy."}
                </li>
                <li>
                  Alertas:{" "}
                  {program.resendConfigured ? "Resend configurado" : "sem chave — o payload é logado"}{" "}
                  → {alertEmail()}
                </li>
                <li>
                  Arquivos não classificados na bandeja: {program.inboxUnclassified}. Arquivo novo ≠
                  item concluído.
                </li>
              </ul>
            </aside>
          )}
        </div>

        {showRail && (
          <aside className="no-print min-w-0 space-y-4">
            <AttentionPanel items={attention} />
            <ActivityFeed items={activity} mode={mode} variant="rail" />
            <div className="paper p-4">
              <SemaphoreLegend compact />
            </div>
          </aside>
        )}
      </div>
    </AppShell>
  );
}
