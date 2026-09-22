import { SEMAPHORE_LABEL } from "../constants";

/** Teto de nomes por onda de lacuna. Pasta, não a bandeja dispensada. */
export const AI_NAME_CAP = 40;
export const AI_PROPOSAL_CAP = 12;

const RULES = `Você é o PMO sênior de M&A da Eleva, na sala de AD+R/Loopert e Rádio Health.
Responda apenas com JSON, em português do Brasil.
Você não publica fato. Devolva propostas para um operador aceitar, editar ou descartar.
Não invente número, valuation, percentual, data, responsável ou documento que não esteja no contexto.
Não peça nem invente conteúdo de PDF ou áudio. Só o nome, quando o contexto o trouxer.
Seja específico: responsável, pilar e prazo somente quando o contexto já os trouxer.
Não classifique arquivo cujo nome não está na lista.
No máximo ${AI_PROPOSAL_CAP} propostas. Se não houver nada útil, devolva {"propostas":[]}.
Formato:
{"propostas":[{"kind":"opl|tarefa|nota|classificacao|atencao","texto":"","titulo":"","responsavel":"","prazo":"","pilar":"","corpo":"","arquivo":"","tipo":"","frente":"","statusDoc":""}]}
pilar é um destes slugs, ou vazio: preparacao, dd, estruturacao, aprovacoes, fechamento, pmi.
tipo é nda, ata, transcricao, contrato, financeiro ou outro.
statusDoc é rascunho, assinado, vigente ou vencido.
frente é o slug da frente que o contexto listar, quando houver.
"(vazio)" num campo significa que o registro não tem o dado.`;

export const AI_SYSTEM_A = `${RULES}
Onda A — status das próximas semanas.
Use a OPL, as tarefas abertas ou atrasadas, os riscos, o que trava, o semáforo e as cinco decisões.
Procure só isto: prazo já vencido (a data é anterior a hoje), responsável vazio, duplicata de ponto ou tarefa, semáforo do deal ou da frente que não combina com a OPL.
Não proponha lacuna de arquivo nesta onda.`;

export const AI_SYSTEM_B = `${RULES}
Onda B — lacuna entre arquivo e OPL.
Cada nome em Arquivos existe na pasta. Se a OPL não cobre esse arquivo, proponha kind "atencao" e texto "verificar X no Drive", em que X é exatamente um nome da lista.
Não invente nome. Não repita arquivo que já tem ponto.`;

export const AI_SYSTEM_C_HEALTH = `${RULES}
Onda C — o mesmo trabalho das ondas A e B, juntos, neste bundle da Rádio Health.
Status: prazo vencido, responsável vazio, duplicata, semáforo que não combina com a OPL.
Lacuna: arquivo listado sem ponto na OPL, kind "atencao", texto "verificar X no Drive".
Não repita o que já está na fila.`;

export const AI_SYSTEM_C_LOOPERT = `${RULES}
Onda C — só nomes de Relatorios e Open Point List que a lista de Ata, Transcricoes e Doctos não levou.
Se o arquivo existe e a OPL não o cobre, kind "atencao" e texto "verificar X no Drive", com X na lista desta onda.
Não traga de novo Ata, Transcricoes nem Doctos.`;

/** Fallback se uma chamada não mandar o sistema da onda. */
export const AI_SYSTEM = AI_SYSTEM_A;

const MAX = 36000;

export type StatusRow = {
  title: string;
  owner: string;
  due: string;
  pillar: string;
  status: string;
};

export type StatusBriefInput = {
  today: string;
  name: string;
  slug: string;
  headline: string;
  health: string;
  healthReason: string;
  fronts: string[];
  pillars: string[];
  blockers: string[];
  openPoints: StatusRow[];
  tasks: StatusRow[];
  risks: { title: string; severity: string }[];
  decisions: { date: string; who: string; text: string }[];
};

export type GapBriefInput = {
  today: string;
  name: string;
  slug: string;
  folders: string;
  names: string[];
  openPointTitles: string[];
  note?: string;
};

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

export function slot(value: string | null | undefined) {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  return text || "(vazio)";
}

function light(tone: string) {
  const label = SEMAPHORE_LABEL[tone];
  return label ? `${tone} (${label})` : tone;
}

function block(title: string, rows: string[], empty: string) {
  return rows.length ? `${title}:\n- ${rows.join("\n- ")}` : `${title}: ${empty}`;
}

function fit(text: string) {
  return text.length <= MAX ? text : `${text.slice(0, MAX - 1)}…`;
}

export function buildStatusBrief(input: StatusBriefInput) {
  const points = input.openPoints
    .slice(0, 36)
    .map((row) => line([clip(row.title, 180), slot(row.owner), slot(row.due), slot(row.pillar), row.status]));
  const tasks = input.tasks
    .slice(0, 24)
    .map((row) => line([clip(row.title, 180), slot(row.owner), slot(row.due), slot(row.pillar), row.status]));
  const risks = input.risks.slice(0, 24).map((row) => line([clip(row.title, 180), light(row.severity)]));
  const decisions = input.decisions
    .slice(0, 5)
    .map((row) => line([row.date, row.who, clip(row.text, 180)]));
  const blockers = input.blockers.slice(0, 8).map((item) => clip(item, 180));
  const text = [
    `Hoje: ${input.today}`,
    `Deal: ${input.name} (${input.slug})`,
    `Manchete: ${clip(input.headline, 400)}`,
    `Semáforo do deal: ${light(input.health)} | ${clip(input.healthReason, 280)}`,
    block("Frentes", input.fronts.map((item) => clip(item, 180)), "nenhuma."),
    block("Pilares", input.pillars, "nenhum."),
    block("O que trava", blockers, "nada listado."),
    block("Pontos em aberto (OPL)", points, "nenhum."),
    block("Tarefas abertas ou atrasadas", tasks, "nenhuma."),
    block("Riscos", risks, "nenhum."),
    block("Decisões", decisions, "nenhuma."),
  ].join("\n\n");
  return fit(text);
}

export function buildGapBrief(input: GapBriefInput) {
  const names = input.names.slice(0, AI_NAME_CAP).map((name) => clip(name, 180));
  const points = input.openPointTitles.slice(0, 36).map((title) => clip(title, 180));
  const text = [
    `Hoje: ${input.today}`,
    `Deal: ${input.name} (${input.slug})`,
    `Pastas: ${input.folders}`,
    input.note ? clip(input.note, 240) : "",
    "Não há conteúdo de arquivo. Só o nome.",
    block("Arquivos", names, "nenhum."),
    block("Pontos em aberto (título)", points, "nenhum."),
  ]
    .filter(Boolean)
    .join("\n\n");
  return fit(text);
}

export function buildRadioCloseBrief(status: string, gap: string) {
  return fit(`Onda C — status e lacuna no mesmo bundle.\n\n${status}\n\n${gap}`);
}

export function withPending(brief: string, pending: string[]) {
  const lines = pending
    .map((item) => clip(item, 180))
    .filter(Boolean)
    .slice(-30);
  const tail = lines.length ? `Já na fila (não repetir):\n- ${lines.join("\n- ")}` : "Já na fila (não repetir): nenhuma.";
  return fit(`${brief}\n\n${tail}`);
}

export function todayLabel(now = new Date()) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const day = get("day");
  const month = get("month");
  const year = get("year");
  return day && month && year ? `${day}/${month}/${year}` : "";
}
