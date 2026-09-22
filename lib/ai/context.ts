import type { ActionItem, Decision, OpenPoint } from "../types";

/** O que a leitura pode citar. Curto de propósito: sem PDF, sem binário, sem tese. */
export type DealBriefInput = {
  name: string;
  slug: string;
  headline: string;
  blockers: string[];
  openPoints: Pick<OpenPoint, "title" | "owner" | "due" | "pillarSlug" | "status">[];
  tasks: Pick<ActionItem, "title" | "owner" | "due" | "pillarSlug" | "status">[];
  decisions: Pick<Decision, "date" | "whoLabel" | "decisionTaken">[];
  files: { name: string }[];
  fronts: string[];
};

const MAX = 6000;

export const AI_SYSTEM = `Você é o PMO sênior de M&A da Eleva, na sala de AD+R/Loopert e Rádio Health.
Responda apenas com JSON, em português do Brasil.
Você não publica fato. Devolva uma lista de propostas para um operador aceitar, editar ou descartar.
Não invente número, valuation, percentual, data ou documento que não esteja no contexto.
Se não tiver certeza, use kind "atencao" e texto no formato "verificar X no Drive", em que X já aparece no contexto.
Seja específico: responsável, pilar e prazo somente quando o contexto já os trouxer.
Não classifique arquivo cujo nome não está na lista. Não peça o conteúdo de PDF.
No máximo 6 propostas. Se não houver nada útil, devolva {"propostas":[]}.
Formato:
{"propostas":[{"kind":"opl|tarefa|nota|classificacao|atencao","texto":"","titulo":"","responsavel":"","prazo":"","pilar":"","corpo":"","arquivo":"","tipo":"","frente":"","statusDoc":""}]}
pilar é um destes slugs, ou vazio: preparacao, dd, estruturacao, aprovacoes, fechamento, pmi.
tipo é nda, ata, transcricao, contrato, financeiro ou outro.
statusDoc é rascunho, assinado, vigente ou vencido.
frente é o slug da frente que o contexto listar, quando houver.`;

function clip(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function line(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" | ");
}

/** Texto curto do deal em Operar. Sem arquivo binário e sem número fora desta lista. */
export function buildDealBrief(input: DealBriefInput): string {
  const points = input.openPoints
    .filter((point) => point.status !== "resolvido")
    .slice(0, 12)
    .map((point) => line([point.title, point.owner, point.due, point.pillarSlug, point.status]));
  const tasks = input.tasks
    .filter((task) => task.status === "open" || task.status === "late")
    .slice(0, 12)
    .map((task) => line([task.title, task.owner, task.due, task.pillarSlug, task.status]));
  const decisions = input.decisions.slice(0, 5).map((decision) => line([decision.date, decision.whoLabel, clip(decision.decisionTaken, 180)]));
  const files = input.files.slice(0, 20).map((file) => file.name.trim()).filter(Boolean);
  const blockers = input.blockers.slice(0, 6).map((lineText) => clip(lineText, 180));

  const blocks = [
    `Deal: ${input.name} (${input.slug})`,
    `Manchete: ${clip(input.headline, 400)}`,
    blockers.length ? `O que trava:\n- ${blockers.join("\n- ")}` : "O que trava: nada listado.",
    points.length ? `Pontos em aberto:\n- ${points.join("\n- ")}` : "Pontos em aberto: nenhum.",
    tasks.length ? `Tarefas abertas ou atrasadas:\n- ${tasks.join("\n- ")}` : "Tarefas abertas ou atrasadas: nenhuma.",
    decisions.length ? `Decisões recentes:\n- ${decisions.join("\n- ")}` : "Decisões recentes: nenhuma.",
    files.length ? `Arquivos da bandeja sem classificar (só o nome):\n- ${files.join("\n- ")}` : "Arquivos da bandeja sem classificar: nenhum.",
    "Pilares: preparacao, dd, estruturacao, aprovacoes, fechamento, pmi",
    input.fronts.length ? `Frentes: ${input.fronts.join(", ")}` : "Frentes: nenhuma.",
  ];
  const text = blocks.join("\n\n");
  return text.length <= MAX ? text : `${text.slice(0, MAX - 1)}…`;
}
