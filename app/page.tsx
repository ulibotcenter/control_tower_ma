import { AppShell } from "@/components/shell/app-shell";
import { BoardCard } from "@/components/home/board-card";
import { DealCard } from "@/components/home/deal-card";
import { ProgramSnapshot } from "@/components/home/program-snapshot";
import { Term } from "@/components/ui/term";
import { WithTerms } from "@/components/ui/with-terms";
import { folderUrl, DRIVE_FOLDERS } from "@/lib/constants";
import { alertEmail } from "@/lib/config";
import { getActivity, getProgram } from "@/lib/data/provider";
import { MODE_META, viewChrome } from "@/lib/mode-meta";
import { getMode } from "@/lib/mode";
import { getPresent } from "@/lib/present";
import { DriveLink } from "@/components/ui/drive-link";
import { Freshness } from "@/components/ui/freshness";
import { ExportPdfButton } from "@/components/export/export-pdf-button";
import { ActivityFeed } from "@/components/home/activity-feed";

export default async function HomePage() {
  const mode = await getMode();
  const present = await getPresent();
  const [program, activity] = await Promise.all([
    getProgram(mode),
    getActivity(mode, present ? 4 : 8),
  ]);
  const chrome = viewChrome(mode, present);
  const meta = MODE_META[mode];

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">
            Programa de <Term id="ma">M&amp;A</Term>
          </p>
          <h1 className="serif mt-1 text-4xl text-navy sm:text-5xl">Go Live</h1>
          <Freshness />
        </div>
        {present && (
          <div className="no-print hidden sm:block">
            <ExportPdfButton present pageLabel="Programa" surface="page" />
          </div>
        )}
      </div>
      {present && mode !== "target" ? (
        <p className="mt-3 max-w-3xl text-[17px] leading-relaxed">
          Loopert primeiro. Radio Health em análise. Abaixo: status, próximo marco e o que o board
          precisa decidir.
        </p>
      ) : (
        <>
          <p className="mt-3 max-w-3xl text-[17px] leading-relaxed">
            <WithTerms text={meta.homeLead} />
          </p>
          {meta.homeSub && (
            <p className="mt-2 max-w-3xl text-sm text-muted">
              <WithTerms text={meta.homeSub} />
            </p>
          )}
        </>
      )}

      <div className="mt-8">
        <ProgramSnapshot deals={program.deals} mode={mode} />
      </div>

      <div className="mt-6 grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.85fr)]">
        <BoardCard card={program.board} mode={mode} />
        <ActivityFeed items={activity} compact={present} />
      </div>

      <div className="mt-6 grid items-stretch gap-5 lg:grid-cols-2">
        {program.deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            redCount={deal.redCount}
            topReds={present ? deal.topReds.slice(0, 2) : deal.topReds}
            mode={mode}
          />
        ))}
      </div>

      {chrome.showOperateAside && (
        <aside className="no-print mt-10 paper p-5 text-sm leading-relaxed">
          <p className="kicker">Operação da torre</p>
          <ul className="mt-3 space-y-1.5">
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
              Alertas: {program.resendConfigured ? "Resend configurado" : "sem chave — o payload é logado"}{" "}
              → {alertEmail()}
            </li>
            <li>
              Arquivos não classificados na bandeja: {program.inboxUnclassified}. Arquivo novo ≠ item
              concluído.
            </li>
            <li>
              Apresentação viva em Apresentacoes/ não é atualizada por esta torre. Pack vai para{" "}
              Control Tower/Exports/. Use Exportar PDF para um documento de reunião desta tela.
            </li>
          </ul>
        </aside>
      )}
    </AppShell>
  );
}
