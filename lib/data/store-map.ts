import type {
  ActionItem,
  ChecklistItem,
  Decision,
  DocumentStatus,
  DocumentType,
  DriveDocument,
  InboxFile,
  Note,
  OpenPoint,
  OpenPointStatus,
  Sensitivity,
  Visibility,
} from "../types";

export function checklistFromInbox(file: InboxFile): ChecklistItem | null {
  const ws = file.classification?.workstreamSlug;
  if (!file.classified || !file.classification || !ws) return null;
  return {
    id: `ck-inbox-${file.id}`,
    dealId: file.classification.dealId,
    workstreamSlug: ws,
    title: file.name,
    status: "em_andamento",
    documentId: `inbox-${file.id}`,
    driveUrl: file.driveUrl,
    note: "Veio da bandeja. Classificar não conclui o item nem muda o semáforo.",
    visibility: "advisors",
    sensitivities: [],
  };
}

export function documentFromInbox(file: InboxFile): DriveDocument | null {
  if (!file.classified || !file.classification) return null;
  return {
    id: `inbox-${file.id}`,
    dealId: file.classification.dealId,
    title: file.name,
    driveUrl: file.driveUrl || "",
    driveId: file.driveId,
    folderId: null,
    type: file.classification.type,
    workstreamSlug: file.classification.workstreamSlug,
    status: file.classification.status,
    classified: true,
    note: "Classificado na bandeja. Arquivo classificado ≠ item concluído.",
    visibility: "advisors",
    sensitivities: [],
  };
}

export function mapInboxRow(row: {
  id: string;
  name: string;
  source: string;
  drive_url: string | null;
  drive_id: string | null;
  received_at: string;
  classified: boolean;
  deal_id: string | null;
  type: string | null;
  workstream_slug: string | null;
  status: string | null;
}): InboxFile {
  const file: InboxFile = {
    id: row.id,
    name: row.name,
    source: row.source === "drive" ? "drive" : "manual",
    driveUrl: row.drive_url || null,
    driveId: row.drive_id,
    receivedAt: row.received_at,
    classified: row.classified,
  };
  if (row.classified && row.deal_id && row.type && row.status) {
    file.classification = {
      dealId: row.deal_id,
      type: row.type as DocumentType,
      workstreamSlug: row.workstream_slug,
      status: row.status as DocumentStatus,
    };
  }
  return file;
}

export function mapDocumentRow(row: {
  id: string;
  deal_id: string | null;
  title: string;
  drive_url: string;
  drive_id: string | null;
  folder_id: string | null;
  type: string;
  workstream_slug: string | null;
  status: string;
  classified: boolean;
  note: string | null;
  visibility: string;
  sensitivities: string[] | null;
}): DriveDocument {
  return {
    id: row.id,
    dealId: row.deal_id,
    title: row.title,
    driveUrl: row.drive_url || "",
    driveId: row.drive_id,
    folderId: row.folder_id,
    type: row.type as DocumentType,
    workstreamSlug: row.workstream_slug,
    status: row.status as DocumentStatus,
    classified: row.classified,
    note: row.note ?? undefined,
    visibility: (row.visibility as Visibility) || "advisors",
    sensitivities: (row.sensitivities ?? []) as Sensitivity[],
  };
}

export function mapChecklistRow(row: {
  id: string;
  deal_id: string;
  workstream_slug: string;
  title: string;
  status: string;
  document_id: string | null;
  drive_url: string | null;
  note: string | null;
  visibility: string;
  sensitivities: string[] | null;
}): ChecklistItem {
  return {
    id: row.id,
    dealId: row.deal_id,
    workstreamSlug: row.workstream_slug,
    title: row.title,
    status: row.status as ChecklistItem["status"],
    documentId: row.document_id,
    driveUrl: row.drive_url,
    note: row.note ?? undefined,
    visibility: (row.visibility as Visibility) || "advisors",
    sensitivities: (row.sensitivities ?? []) as Sensitivity[],
  };
}

function asVisibility(value: unknown, fallback: Visibility): Visibility {
  return value === "operate" || value === "advisors" || value === "target" ? value : fallback;
}

function asSensitivities(value: unknown): Sensitivity[] {
  return Array.isArray(value) ? (value.filter((item) => typeof item === "string") as Sensitivity[]) : [];
}

export function mapOpenPointRow(row: Record<string, unknown>, dealId: string): OpenPoint {
  const statusRaw = String(row.status ?? "aberto");
  const status: OpenPointStatus =
    statusRaw === "em_curso" || statusRaw === "travado" || statusRaw === "resolvido" ? statusRaw : "aberto";
  const createdAt = String(row.created_at ?? new Date().toISOString());
  return {
    id: String(row.id ?? ""),
    dealId,
    title: String(row.title ?? ""),
    owner: row.owner == null ? "" : String(row.owner),
    due: row.due == null ? "" : String(row.due),
    pillarSlug: row.pillar_slug ? String(row.pillar_slug) : null,
    status,
    visibility: asVisibility(row.visibility, "advisors"),
    sensitivities: [],
    createdAt,
    updatedAt: String(row.updated_at ?? createdAt),
  };
}

export function mapActionRow(row: Record<string, unknown>, dealId: string): ActionItem {
  const statusRaw = String(row.status ?? "open");
  const status: ActionItem["status"] =
    statusRaw === "late" || statusRaw === "done" ? statusRaw : "open";
  return {
    id: String(row.id ?? ""),
    dealId,
    workstreamSlug: row.workstream_slug ? String(row.workstream_slug) : null,
    pillarSlug: row.pillar_slug ? String(row.pillar_slug) : null,
    title: String(row.title ?? ""),
    owner: row.owner == null ? "" : String(row.owner),
    due: row.due == null ? "" : String(row.due),
    status,
    visibility: asVisibility(row.visibility, "advisors"),
    sensitivities: asSensitivities(row.sensitivities),
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

export function mapNoteRow(row: Record<string, unknown>, dealId: string | null): Note {
  return {
    id: String(row.id ?? ""),
    dealId,
    body: String(row.body ?? ""),
    visibility: asVisibility(row.visibility, "operate"),
    sensitivities: asSensitivities(row.sensitivities),
  };
}

export function mapDecisionRow(row: Record<string, unknown>): Decision {
  const who = String(row.who ?? "eleva");
  const date = row.date ?? row.created_at ?? "";
  return {
    id: String(row.id ?? ""),
    dealId: (row.deal_id as string | null | undefined) ?? (row.dealId as string | null | undefined) ?? null,
    who: (who === "board" || who === "pacta" || who === "eleva" ? who : "eleva") as Decision["who"],
    whoLabel: String(row.who_label ?? row.whoLabel ?? who),
    date: String(date).slice(0, 10),
    elevaRecommendation: String(row.eleva_recommendation ?? row.elevaRecommendation ?? ""),
    decisionTaken: String(row.decision_taken ?? row.decisionTaken ?? ""),
    againstRecommendation: Boolean(row.against_recommendation ?? row.againstRecommendation),
    consequence: String(row.consequence ?? ""),
  };
}
