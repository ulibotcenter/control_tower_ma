import { SEMAPHORE_LABEL } from "../constants";

/** Teto de nomes por onda de lacuna. Pasta, não a bandeja dispensada. */
export const AI_NAME_CAP = 40;
export const AI_PROPOSAL_CAP = 12;

const RULES = `Você é o PMO sênior da Eleva no M&A AD+R × Loopert (prioridade) e Rádio Health (paralelo).
Trabalha com a OPL, os riscos, as decisões e o TEXTO das atas e transcrições.
NUNCA peça, baixe ou cite arquivo de áudio (.m4a, .mp3, .wav) e nunca diga “ouça a gravação”.
Não invente número, percentual ou cláusula que não esteja no texto ou no contexto.
Aponte o buraco: o que a ata decidiu e a OPL não tem; prazo morto; responsável vazio; deal errado (Loopert vs Rádio Health).
Proposta acionável: kind, título, responsável se o texto tiver, pilar.
Se o arquivo é novo desde o último Pedir leitura, priorize-o.
Português do Brasil. Só JSON de propostas. Você não publica fato. Quem opera aceita, edita ou descarta.
PDF entra só pelo nome. Não peça o conteúdo de PDF.
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
Onda B — uma ata ou transcrição por chamada, com o corpo desse arquivo e a OPL.
O bloco Textos novos é um único arquivo: o que a ata decidiu e a OPL não tem.
Se a OPL não cobre o arquivo, kind "atencao" e texto "verificar X no Drive", em que X é um nome da lista.
"não deu para ler o corpo" significa que o export falhou: use só o nome.
Não invente nome. Não cite áudio. Não repita arquivo que já tem ponto.`;

export const AI_SYSTEM_C_HEALTH = `${RULES}
Onda C — só nomes e a OPL deste recorte da Rádio Health. Não há corpo de ata.
Lacuna: arquivo listado sem ponto na OPL, kind "atencao", texto "verificar X no Drive".
Não repita o que já está na fila. Não cite áudio.`;

export const AI_SYSTEM_C_LOOPERT = `${RULES}
Onda C — só nomes de Relatorios e Open Point List que a lista de Ata, Transcricoes e Doctos não levou.
Não há corpo de ata. Se o arquivo existe e a OPL não o cobre, kind "atencao" e texto "verificar X no Drive", com X na lista desta onda.
Não traga de novo Ata, Transcricoes nem Doctos.`;

/** Fallback se uma chamada não mandar o sistema da onda. */
export const AI_SYSTEM = AI_SYSTEM_A;

const MAX = 56000;

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

export type GapText = { name: string; body: string };

export type GapBriefInput = {
  today: string;
  name: string;
  slug: string;
  folders: string;
  names: string[];
  openPointTitles: string[];
  texts?: GapText[];
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
  const texts = (input.texts ?? []).map((file) => `${file.name}\n${file.body.trim() || "não deu para ler o corpo"}`);
  const text = [
    `Hoje: ${input.today}`,
    `Deal: ${input.name} (${input.slug})`,
    `Pastas: ${input.folders}`,
    input.note ? clip(input.note, 240) : "",
    texts.length
      ? `Textos novos desde o último Pedir leitura (priorizar):\n\n${texts.join("\n\n")}`
      : "Sem texto novo de ata ou transcrição nesta leitura.",
    "PDF só pelo nome. Áudio não entra.",
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
