import type {
  ChecklistItem,
  Decision,
  DocumentStatus,
  DocumentType,
  DriveDocument,
  InboxFile,
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

export function mapDecisionRow(row: {
  id: string;
  deal_id: string | null;
  who: string;
  who_label: string | null;
  date: string;
  eleva_recommendation: string;
  decision_taken: string;
  against_recommendation: boolean;
  consequence: string | null;
}): Decision {
  return {
    id: row.id,
    dealId: row.deal_id,
    who: row.who as Decision["who"],
    whoLabel: row.who_label || row.who,
    date: String(row.date).slice(0, 10),
    elevaRecommendation: row.eleva_recommendation,
    decisionTaken: row.decision_taken,
    againstRecommendation: row.against_recommendation,
    consequence: row.consequence || "",
  };
}
