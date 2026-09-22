import { isPillarSlug } from "../pillars";
import { AI_PROPOSAL_CAP } from "./context";
import type {
  AiProposalKind,
  AiProposalPayload,
  DocumentStatus,
  DocumentType,
  Visibility,
} from "../types";

const KINDS: AiProposalKind[] = ["opl", "tarefa", "nota", "classificacao", "atencao"];
const TYPES: DocumentType[] = ["nda", "ata", "transcricao", "contrato", "financeiro", "outro"];
const DOC_STATUSES: DocumentStatus[] = ["rascunho", "assinado", "vigente", "vencido"];
const VISIBILITIES: Visibility[] = ["operate", "advisors", "target"];

export type ProposalDraft = {
  kind: AiProposalKind;
  payload: AiProposalPayload;
};

export type ProposalCheck = {
  brief: string;
  dealId: string;
  files: { id: string; name: string }[];
  workstreamSlugs: string[];
  /** Teto da onda. O parser não completa buraco. */
  limit?: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function textOf(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function pick(row: Record<string, unknown>, keys: string[], max: number) {
  for (const key of keys) {
    const text = textOf(row[key], max);
    if (text) return text;
  }
  return "";
}

export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced?.[1] ?? trimmed).trim();
  try {
    return JSON.parse(body);
  } catch {
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(body.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** Número, percentual ou valor que o contexto não contém. */
export function hasForeignFigure(text: string, brief: string) {
  const percents = text.match(/\d+(?:[.,]\d+)?\s*%/g) ?? [];
  for (const token of percents) {
    const tight = token.replace(/\s+/g, "");
    if (!brief.includes(token) && !brief.includes(tight)) return true;
  }
  const money = text.match(/R\$\s*\d[\d.]*(?:,\d+)?/gi) ?? [];
  for (const token of money) {
    const tight = token.replace(/\s+/g, "");
    if (!brief.toLowerCase().includes(token.toLowerCase()) && !brief.toLowerCase().includes(tight.toLowerCase())) {
      return true;
    }
  }
  const nums = text.match(/\d{2,}(?:[.,]\d+)*/g) ?? [];
  return nums.some((token) => !brief.includes(token));
}

function grounded(value: string, brief: string) {
  const text = value.trim();
  if (!text) return "";
  return brief.toLowerCase().includes(text.toLowerCase()) ? text : "";
}

function kindOf(value: unknown): AiProposalKind | null {
  return typeof value === "string" && (KINDS as string[]).includes(value) ? (value as AiProposalKind) : null;
}

function visibilityOf(value: string, fallback: Visibility): Visibility {
  return (VISIBILITIES as string[]).includes(value) ? (value as Visibility) : fallback;
}

function fileOf(name: string, id: string, files: ProposalCheck["files"]) {
  const byName = files.filter((file) => file.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (name && byName.length === 1) return byName[0];
  if (id) {
    const byId = files.find((file) => file.id === id);
    if (byId && (!name || byId.name.trim().toLowerCase() === name.trim().toLowerCase())) return byId;
  }
  return null;
}

function one(row: Record<string, unknown>, check: ProposalCheck): ProposalDraft | null {
  const kind = kindOf(row.kind);
  if (!kind) return null;
  const texto = pick(row, ["texto", "text"], 500);
  const titulo = pick(row, ["titulo", "title"], 280);
  const corpo = pick(row, ["corpo", "body"], 4000);
  const said = [texto, titulo, corpo].filter(Boolean).join(" ");
  if (!texto || hasForeignFigure(said, check.brief)) return null;

  if (kind === "atencao") {
    return { kind, payload: { text: texto } };
  }

  if (kind === "nota") {
    const body = corpo || texto;
    if (hasForeignFigure(body, check.brief)) return null;
    return {
      kind,
      payload: {
        text: texto,
        body,
        visibility: visibilityOf(pick(row, ["visibilidade", "visibility"], 20), "operate"),
      },
    };
  }

  if (kind === "classificacao") {
    const file = fileOf(pick(row, ["arquivo", "fileName"], 240), pick(row, ["arquivoId", "inboxId"], 80), check.files);
    const type = pick(row, ["tipo", "type"], 40);
    const front = pick(row, ["frente", "workstreamSlug"], 80);
    const status = pick(row, ["statusDoc", "docStatus", "status"], 40);
    if (!file) return null;
    if (!(TYPES as string[]).includes(type)) return null;
    if (!(DOC_STATUSES as string[]).includes(status)) return null;
    if (!check.workstreamSlugs.includes(front)) return null;
    return {
      kind,
      payload: {
        text: texto,
        fileName: file.name,
        inboxId: file.id,
        type: type as DocumentType,
        workstreamSlug: front,
        docStatus: status as DocumentStatus,
      },
    };
  }

  const title = titulo || texto;
  if (hasForeignFigure(title, check.brief)) return null;
  const pillar = pick(row, ["pilar", "pillarSlug"], 40);
  const owner = grounded(pick(row, ["responsavel", "owner"], 120), check.brief);
  const due = grounded(pick(row, ["prazo", "due"], 80), check.brief);
  return {
    kind,
    payload: {
      text: texto,
      title: title.slice(0, 280),
      owner,
      due,
      pillarSlug: isPillarSlug(pillar) ? pillar : null,
      visibility: visibilityOf(pick(row, ["visibilidade", "visibility"], 20), "advisors"),
    },
  };
}

/** Lista saneada. O que não está no contexto sai. Não completa buraco com proposta inventada. */
export function parseModelProposals(raw: string, check: ProposalCheck): ProposalDraft[] {
  const parsed = asRecord(extractJson(raw));
  const list = parsed?.propostas ?? parsed?.proposals;
  if (!Array.isArray(list)) return [];
  const out: ProposalDraft[] = [];
  for (const item of list) {
    const row = asRecord(item);
    if (!row) continue;
    const draft = one(row, check);
    if (!draft) continue;
    out.push(draft);
    if (out.length >= (check.limit ?? AI_PROPOSAL_CAP)) break;
  }
  return out;
}
