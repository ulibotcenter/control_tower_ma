import { AppShell } from "@/components/shell/app-shell";
import { BoardCard } from "@/components/home/board-card";
import { DealCard } from "@/components/home/deal-card";
import { Term } from "@/components/ui/term";
import { folderUrl, DRIVE_FOLDERS } from "@/lib/constants";
import { alertEmail } from "@/lib/config";
import { getProgram } from "@/lib/data/provider";
import { getMode } from "@/lib/mode";
import { DriveLink } from "@/components/ui/drive-link";

export default async function HomePage() {
  const mode = await getMode();
  const program = await getProgram(mode);

  return (
    <AppShell>
      <p className="kicker">Programa de M&amp;A</p>
      <h1 className="serif mt-1 text-4xl text-navy sm:text-5xl">Go Live</h1>
      {mode === "target" ? (
        <p className="mt-3 max-w-3xl text-[17px] leading-relaxed">
          Programa com duas operações em avaliação. Em cada uma: fase, documentos pedidos e
          pendências formais. Semáforo no topo da tela.
        </p>
      ) : (
        <>
          <p className="mt-3 max-w-3xl text-[17px] leading-relaxed">
            Duas compras buy-side da AD+R (Massa FM, Mix FM, Nova Brasil). Sponsors: Camila
            Kovacevick (CEO) e Matheus Vasconcelos (CFO). PMO Eleva. Jurídico: Pacta. Financeiro:
            João Amorim / M12C. A prioridade é a Loopert. Radio Health está congelada.
          </p>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Cada deal tem <Term id="workstream">workstreams</Term>. Ainda não há{" "}
            <Term id="loi">LOI</Term> nem <Term id="spa">SPA</Term>. Closing-alvo da Loopert:
            jan/2027, flexível.
          </p>
        </>
      )}

      <div className="mt-8">
        <BoardCard card={program.board} target={mode === "target"} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {program.deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            redCount={deal.redCount}
            topReds={deal.topReds}
            modeTarget={mode === "target"}
          />
        ))}
      </div>

      {mode === "operate" && (
        <aside className="mt-10 paper p-5 text-sm leading-relaxed">
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
              Supabase:{" "}
              {program.supabaseConfigured
                ? "lendo/escrevendo (bandeja, classificação, decisões)."
                : "não ligado — seed local + .data/"}.
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
              Control Tower/Exports/.
            </li>
          </ul>
        </aside>
      )}
    </AppShell>
  );
}
