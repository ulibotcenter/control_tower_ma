import { AppShell } from "@/components/shell/app-shell";
import { BoardCard } from "@/components/home/board-card";
import { DealCard } from "@/components/home/deal-card";
import { Term } from "@/components/ui/term";
import { WithTerms } from "@/components/ui/with-terms";
import { folderUrl, DRIVE_FOLDERS } from "@/lib/constants";
import { alertEmail } from "@/lib/config";
import { getActivity, getProgram } from "@/lib/data/provider";
import { MODE_META, TARGET_COPY, viewChrome } from "@/lib/mode-meta";
import { getLockedDeal, getMode } from "@/lib/mode";
import { getPresent } from "@/lib/present";
import { DriveLink } from "@/components/ui/drive-link";
import { Freshness } from "@/components/ui/freshness";
import { ExportPdfButton } from "@/components/export/export-pdf-button";
import { ActivityFeed } from "@/components/home/activity-feed";

export default async function HomePage() {
  const mode = await getMode();
  const onlyDeal = await getLockedDeal();
  const present = await getPresent();
  const [program, activity] = await Promise.all([
    getProgram(mode, { onlyDeal }),
    getActivity(mode, present ? 4 : 8, { onlyDeal }),
  ]);
  const chrome = viewChrome(mode, present);
  const meta = MODE_META[mode];

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {/* Nome do programa e sigla de M&A são vocabulário nosso, não da sala. */}
          <p className="kicker">
            {mode === "target" ? (
              TARGET_COPY.homeKicker
            ) : (
              <>
                Programa de <Term id="ma">M&amp;A</Term>
              </>
            )}
          </p>
          <h1 className="serif mt-1 text-4xl text-navy sm:text-5xl">
            {mode === "target" ? TARGET_COPY.homeTitle : "Go Live"}
          </h1>
          <Freshness mode={mode} />
        </div>
        {present && mode !== "target" && (
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

      {/* As operações são a peça principal da home: uma carta cada, lado a lado.
          Com a reunião travada num alvo sobra uma só — aí ela ocupa a largura
          inteira, em vez de ficar uma meia carta e um vazio ao lado. */}
      <div
        className={`mt-10 grid items-stretch gap-5 ${
          program.deals.length > 1 ? "lg:grid-cols-2" : "grid-cols-1"
        }`}
      >
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

      <div className="mt-10">
        <BoardCard card={program.board} mode={mode} />
      </div>

      <div className="mt-10">
        <ActivityFeed items={activity} mode={mode} compact={present} />
      </div>

      {chrome.showOperateAside && (
        <aside className="no-print mt-10 paper p-5 text-sm leading-relaxed">
          <h2 className="text-[15px] font-semibold text-navy">Operação da torre</h2>
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
