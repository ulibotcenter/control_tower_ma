import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getProgram } from "@/lib/data/provider";
import { listDecisions } from "@/lib/data/store";
import { getMode } from "@/lib/mode";
import { CORTE, DRIVE_EXPORTS_PATH, SEMAPHORE_LABEL } from "@/lib/constants";
import { isDriveConfigured } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { PackButton } from "@/components/export/pack-button";

export default async function PackPage() {
  const mode = await getMode();
  if (mode !== "operate") redirect("/");
  const program = await getProgram("operate");
  const decisions = await listDecisions();

  return (
    <AppShell>
      <p className="kicker">Artefato novo · sem mexer no data room</p>
      <h1 className="serif text-4xl text-navy">Pack da semana</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        A apresentação viva em Apresentacoes/ não é atualizada por esta torre. O pack é um resumo +
        log de decisão. Destino no Drive, quando a API existir: raiz / {DRIVE_EXPORTS_PATH}. Sem
        API, o arquivo baixa no navegador.
      </p>


      <article className="paper mt-8 p-6">
        <p className="kicker">Go Live · corte {CORTE}</p>
        <h2 className="serif mt-2 text-2xl text-navy">{program.board.sentence}</h2>
        <p className="mt-1 text-sm text-muted">
          {program.board.owner} · {program.board.date}
        </p>
        <ul className="mt-6 space-y-4">
          {program.deals.map((d) => (
            <li key={d.id}>
              <p className="font-semibold text-navy">
                {d.name} · {d.phaseLabel} · {SEMAPHORE_LABEL[d.health]}
              </p>
              <p className="text-sm">{d.headline}</p>
              <p className="text-sm text-muted">Próximo · {d.nextMilestone}</p>
              {d.topReds.length > 0 && (
                <p className="text-sm">Vermelhos: {d.topReds.join(" · ")}</p>
              )}
            </li>
          ))}
        </ul>
        <h3 className="mt-8 font-semibold text-navy">Log de decisão</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {decisions.map((d) => (
            <li key={d.id}>
              {formatDate(d.date)} · {d.whoLabel}: {d.decisionTaken}
              {d.againstRecommendation ? " (contra a Eleva)" : ""}
            </li>
          ))}
        </ul>
      </article>

      <PackButton disabled={false} driveConfigured={isDriveConfigured()} />
    </AppShell>
  );
}
