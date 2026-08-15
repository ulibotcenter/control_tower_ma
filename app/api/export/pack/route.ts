import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMode } from "@/lib/mode";
import { getProgram } from "@/lib/data/provider";
import { listDecisions } from "@/lib/data/store";
import { CORTE, DRIVE_EXPORTS_PATH } from "@/lib/constants";
import { isDriveConfigured } from "@/lib/config";
import { formatDate } from "@/lib/format";

export async function POST() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if ((await getMode()) !== "operate") {
    return NextResponse.json({ error: "operate_only" }, { status: 403 });
  }

  const program = await getProgram("operate");
  const decisions = await listDecisions();

  const markdown = [
    `# Control Tower · pack da semana`,
    `Programa Go Live · AD+R · corte ${CORTE}`,
    ``,
    `## Próxima decisão do board`,
    program.board.sentence,
    `Dono: ${program.board.owner} · ${program.board.date}`,
    ``,
    `## Deals`,
    ...program.deals.flatMap((d) => [
      `### ${d.name} (${d.phaseLabel})`,
      d.headline,
      `Saúde: ${d.health} · Próximo: ${d.nextMilestone}`,
      d.topReds.length ? `Vermelhos: ${d.topReds.join("; ")}` : "",
      "",
    ]),
    `## Log de decisão`,
    ...decisions.map(
      (d) =>
        `- ${formatDate(d.date)} · ${d.whoLabel}: ${d.decisionTaken}${d.againstRecommendation ? " [CONTRA a Eleva]" : ""}`,
    ),
    ``,
    `---`,
    `Gerado pela Control Tower. Destino Drive (quando a API existir): ${DRIVE_EXPORTS_PATH}`,
    `A apresentação viva em Apresentacoes/ NÃO foi atualizada.`,
  ].join("\n");

  const driveConfigured = isDriveConfigured();
  const message = driveConfigured
    ? "Markdown gerado. Upload em Control Tower/Exports/ ainda não está ligado — não inventamos que o Drive recebeu o arquivo."
    : "API do Google ausente. Pack baixado localmente. Nada foi gravado no data room.";

  return NextResponse.json({
    ok: true,
    markdown,
    message,
    driveConfigured,
    wroteToDrive: false,
  });
}
