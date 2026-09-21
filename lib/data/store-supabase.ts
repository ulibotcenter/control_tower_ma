/**
 * Implementação Postgres do store dinâmico.
 * Tabelas atuais: inbox_files, decisions, documents (extras), checklist_items (extras).
 *
 * Ponto de extensão: novas coleções do seed (risks, actions, deals, …)
 * entram como funções *Remote neste arquivo, com o mesmo shape de lib/types.ts.
 * O provider passa a chamá-las no lugar do seed. Ver lib/data/sources.ts.
 */
import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
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
} from "../types";
import { sanitizeDriveUrl } from "../http";
import { isUuid } from "./room-input";
import { deals, decisions as seedDecisions } from "./seed";
import { mapActionRow, mapChecklistRow, mapDecisionRow, mapDocumentRow, mapInboxRow, mapNoteRow, mapOpenPointRow } from "./store-map";

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`[supabase] ${context}: ${error?.message ?? "erro desconhecido"}`);
}

export async function listInboxRemote(sb: SupabaseClient): Promise<InboxFile[]> {
  const { data, error } = await sb
    .from("inbox_files")
    .select("*")
    .order("received_at", { ascending: false });
  if (error) fail("list inbox", error);
  return (data ?? []).map(mapInboxRow);
}

export async function getInboxFileRemote(sb: SupabaseClient, id: string): Promise<InboxFile | null> {
  const { data, error } = await sb.from("inbox_files").select("*").eq("id", id).maybeSingle();
  if (error) fail("get inbox", error);
  return data ? mapInboxRow(data) : null;
}

export async function addInboxFileRemote(
  sb: SupabaseClient,
  input: {
    name: string;
    driveUrl?: string | null;
    driveId?: string | null;
    driveModifiedAt?: string | null;
    source?: "manual" | "drive";
  },
): Promise<InboxFile> {
  const driveId = input.driveId?.trim() || null;
  if (driveId) {
    const { data: existing, error: existingErr } = await sb
      .from("inbox_files")
      .select("*")
      .eq("drive_id", driveId)
      .limit(1);
    if (existingErr) fail("lookup inbox drive_id", existingErr);
    if (existing && existing.length) return mapInboxRow(existing[0]);
  }
  const row: Record<string, unknown> = {
    id: randomUUID(),
    name: input.name.trim(),
    source: input.source ?? "manual",
    drive_url: sanitizeDriveUrl(input.driveUrl),
    drive_id: driveId,
    drive_modified_at: input.driveModifiedAt || null,
    received_at: new Date().toISOString(),
    classified: false,
  };
  let { data, error } = await sb.from("inbox_files").insert(row).select("*").single();
  if (error && /drive_modified_at/i.test(error.message)) {
    delete row.drive_modified_at;
    ({ data, error } = await sb.from("inbox_files").insert(row).select("*").single());
  }
  if (error || !data) fail("insert inbox", error);
  return mapInboxRow(data);
}

/** Nome, link e hora. Não mexe em classified nem no status do checklist. */
export async function updateInboxDriveRemote(
  sb: SupabaseClient,
  driveId: string,
  patch: { name?: string; driveUrl?: string | null; driveModifiedAt?: string | null },
): Promise<InboxFile | null> {
  const payload: Record<string, unknown> = {};
  if (patch.name != null) payload.name = patch.name.trim();
  if (patch.driveUrl !== undefined) payload.drive_url = sanitizeDriveUrl(patch.driveUrl);
  if (patch.driveModifiedAt !== undefined) payload.drive_modified_at = patch.driveModifiedAt;
  if (Object.keys(payload).length === 0) return null;
  let { data, error } = await sb.from("inbox_files").update(payload).eq("drive_id", driveId).select("*");
  if (error && /drive_modified_at/i.test(error.message)) {
    delete payload.drive_modified_at;
    if (Object.keys(payload).length === 0) {
      const { data: current, error: readErr } = await sb
        .from("inbox_files")
        .select("*")
        .eq("drive_id", driveId)
        .limit(1);
      if (readErr) fail("update inbox drive", readErr);
      return current?.[0] ? mapInboxRow(current[0]) : null;
    }
    ({ data, error } = await sb.from("inbox_files").update(payload).eq("drive_id", driveId).select("*"));
  }
  if (error) fail("update inbox drive", error);
  const row = data?.[0];
  if (!row) return null;
  if (patch.name != null || patch.driveUrl !== undefined) {
    const docPayload: Record<string, unknown> = {};
    if (patch.name != null) docPayload.title = patch.name.trim();
    if (patch.driveUrl !== undefined) docPayload.drive_url = sanitizeDriveUrl(patch.driveUrl) || "";
    const { error: docErr } = await sb.from("documents").update(docPayload).eq("drive_id", driveId);
    if (docErr) console.error("[drive/sync] document rename", docErr.message);
  }
  return mapInboxRow(row);
}

export async function updateStoredDocumentDriveRemote(
  sb: SupabaseClient,
  driveId: string,
  patch: { title?: string; driveUrl?: string | null },
): Promise<boolean> {
  const payload: Record<string, unknown> = {};
  if (patch.title != null) payload.title = patch.title.trim();
  if (patch.driveUrl !== undefined) payload.drive_url = sanitizeDriveUrl(patch.driveUrl) || "";
  const { data, error } = await sb.from("documents").update(payload).eq("drive_id", driveId).select("id");
  if (error) fail("update document drive", error);
  return Boolean(data && data.length);
}

export async function classifyInboxFileRemote(
  sb: SupabaseClient,
  id: string,
  classification: {
    dealId: string;
    type: DocumentType;
    workstreamSlug: string | null;
    status: DocumentStatus;
  },
): Promise<InboxFile | null> {
  const current = await getInboxFileRemote(sb, id);
  if (!current) return null;

  const docId = randomUUID();
  const { error: docErr } = await sb.from("documents").insert({
    id: docId,
    deal_id: classification.dealId,
    title: current.name,
    drive_url: current.driveUrl || "",
    drive_id: current.driveId,
    folder_id: null,
    type: classification.type,
    workstream_slug: classification.workstreamSlug,
    status: classification.status,
    classified: true,
    note: "Classificado na bandeja. Arquivo classificado ≠ item concluído.",
    visibility: "advisors",
    sensitivities: [],
  });
  if (docErr) fail("insert document", docErr);

  if (classification.workstreamSlug) {
    const { error: ckErr } = await sb.from("checklist_items").insert({
      id: randomUUID(),
      deal_id: classification.dealId,
      workstream_slug: classification.workstreamSlug,
      title: current.name,
      status: "em_andamento",
      document_id: docId,
      drive_url: current.driveUrl,
      note: "Veio da bandeja. Classificar não conclui o item nem muda o semáforo.",
      visibility: "advisors",
      sensitivities: [],
    });
    if (ckErr) fail("insert checklist", ckErr);
  }

  const { data, error } = await sb
    .from("inbox_files")
    .update({
      classified: true,
      deal_id: classification.dealId,
      type: classification.type,
      workstream_slug: classification.workstreamSlug,
      status: classification.status,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) fail("update inbox", error);
  return mapInboxRow(data);
}

export async function extraDocumentsRemote(sb: SupabaseClient): Promise<DriveDocument[]> {
  const { data, error } = await sb.from("documents").select("*").order("title");
  if (error) fail("list documents", error);
  return (data ?? []).map(mapDocumentRow);
}

export async function extraChecklistRemote(sb: SupabaseClient): Promise<ChecklistItem[]> {
  const { data, error } = await sb.from("checklist_items").select("*").order("title");
  if (error) fail("list checklist", error);
  return (data ?? []).map(mapChecklistRow);
}

export async function listDecisionsRemote(sb: SupabaseClient): Promise<Decision[]> {
  const { data, error } = await sb.from("decisions").select("*").order("date", { ascending: false });
  if (error) fail("list decisions", error);
  const remote = (data ?? []).map(mapDecisionRow);
  const remoteIds = new Set(remote.map((d) => d.id));
  const seeded = seedDecisions.filter((d) => !remoteIds.has(d.id));
  return [...remote, ...seeded].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getDecisionRemote(sb: SupabaseClient, id: string): Promise<Decision | null> {
  const { data, error } = await sb.from("decisions").select("*").eq("id", id).maybeSingle();
  if (error) fail("get decision", error);
  if (data) return mapDecisionRow(data);
  return seedDecisions.find((d) => d.id === id) ?? null;
}

export async function addDecisionRemote(
  sb: SupabaseClient,
  input: Omit<Decision, "id">,
): Promise<Decision> {
  const payload = {
    id: randomUUID(),
    deal_id: input.dealId || null,
    who: input.who,
    who_label: input.whoLabel,
    date: input.date,
    eleva_recommendation: input.elevaRecommendation,
    decision_taken: input.decisionTaken,
    against_recommendation: input.againstRecommendation,
    consequence: input.consequence,
  };
  let { data, error } = await sb.from("decisions").insert(payload).select("*").single();
  if (error && payload.deal_id && /uuid|foreign key|invalid input syntax/i.test(error.message)) {
    console.error("[supabase] insert decision deal_id rejeitado, tentando sem deal_id", error.message);
    ({ data, error } = await sb
      .from("decisions")
      .insert({ ...payload, deal_id: null })
      .select("*")
      .single());
  }
  if (error || !data) {
    console.error("[supabase] insert decision failed", error);
    fail("insert decision", error);
  }
  console.info("[data] insert decision ok", data.id);
  return mapDecisionRow(data as Record<string, unknown>);
}

/**
 * O app conhece o deal pelo id do seed (`deal-loopert`) ou pelo slug.
 * No Postgres o FK é uuid: se a tabela `deals` já tem a linha, usa esse id.
 * Não cria deal. Sem linha, devolve o id do seed — o mesmo que decisões já gravam.
 */
export async function resolveWriteDealId(sb: SupabaseClient, seedId: string, slug: string): Promise<string> {
  if (isUuid(seedId)) return seedId;
  const { data, error } = await sb.from("deals").select("id").eq("slug", slug).maybeSingle();
  if (!error && data?.id && isUuid(String(data.id))) return String(data.id);
  return seedId;
}

async function dealCanon(sb: SupabaseClient): Promise<(raw: string | null | undefined) => string> {
  const map = new Map<string, string>();
  for (const deal of deals) {
    map.set(deal.id, deal.id);
    map.set(deal.slug, deal.id);
  }
  const { data, error } = await sb.from("deals").select("id, slug");
  if (error) {
    console.error("[supabase] deals lookup", error.message);
  } else {
    for (const row of data ?? []) {
      const id = row.id ? String(row.id) : "";
      const slug = row.slug ? String(row.slug) : "";
      const seed = deals.find((deal) => deal.slug === slug || deal.id === id);
      if (!seed) continue;
      if (id) map.set(id, seed.id);
      if (slug) map.set(slug, seed.id);
    }
  }
  return (raw) => {
    if (!raw) return "";
    return map.get(raw) ?? raw;
  };
}

function dealRejected(error: { message: string } | null) {
  return Boolean(error && /uuid|foreign key|invalid input syntax/i.test(error.message));
}

export async function listOpenPointsRemote(sb: SupabaseClient): Promise<OpenPoint[]> {
  const canon = await dealCanon(sb);
  const { data, error } = await sb.from("open_points").select("*").order("created_at", { ascending: false });
  if (error) fail("list open points", error);
  return (data ?? []).map((row) => mapOpenPointRow(row as Record<string, unknown>, canon(String((row as { deal_id?: string }).deal_id ?? ""))));
}

export async function addOpenPointRemote(
  sb: SupabaseClient,
  input: Omit<OpenPoint, "id" | "createdAt" | "updatedAt"> & { slug: string },
): Promise<OpenPoint> {
  const now = new Date().toISOString();
  const dealId = await resolveWriteDealId(sb, input.dealId, input.slug);
  const payload = {
    id: randomUUID(),
    deal_id: dealId,
    title: input.title,
    owner: input.owner || null,
    due: input.due || null,
    pillar_slug: input.pillarSlug,
    status: input.status,
    visibility: input.visibility,
    created_at: now,
    updated_at: now,
  };
  const { data, error } = await sb.from("open_points").insert(payload).select("*").single();
  if (error || !data) {
    if (dealRejected(error)) {
      fail(
        "insert open point: deals.slug não devolveu uuid — não inventei o deal",
        error,
      );
    }
    fail("insert open point", error);
  }
  return mapOpenPointRow(data as Record<string, unknown>, input.dealId);
}

export async function updateOpenPointRemote(
  sb: SupabaseClient,
  id: string,
  patch: Partial<Pick<OpenPoint, "title" | "owner" | "due" | "pillarSlug" | "status" | "visibility">>,
): Promise<OpenPoint | null> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title != null) payload.title = patch.title;
  if (patch.owner != null) payload.owner = patch.owner || null;
  if (patch.due != null) payload.due = patch.due || null;
  if (patch.pillarSlug !== undefined) payload.pillar_slug = patch.pillarSlug;
  if (patch.status) payload.status = patch.status;
  if (patch.visibility) payload.visibility = patch.visibility;
  const { data, error } = await sb.from("open_points").update(payload).eq("id", id).select("*").maybeSingle();
  if (error) fail("update open point", error);
  if (!data) return null;
  const canon = await dealCanon(sb);
  return mapOpenPointRow(data as Record<string, unknown>, canon(String((data as { deal_id?: string }).deal_id ?? "")));
}

export async function deleteOpenPointRemote(sb: SupabaseClient, id: string): Promise<boolean> {
  const { data, error } = await sb.from("open_points").delete().eq("id", id).select("id");
  if (error) fail("delete open point", error);
  return Boolean(data && data.length);
}

export async function listExtraActionsRemote(sb: SupabaseClient): Promise<ActionItem[]> {
  const canon = await dealCanon(sb);
  const { data, error } = await sb.from("actions").select("*");
  if (error) fail("list actions", error);
  return (data ?? []).map((row) =>
    mapActionRow(row as Record<string, unknown>, canon(String((row as { deal_id?: string }).deal_id ?? ""))),
  );
}

export async function addActionRemote(
  sb: SupabaseClient,
  input: Omit<ActionItem, "id"> & { slug: string },
): Promise<ActionItem> {
  const dealId = await resolveWriteDealId(sb, input.dealId, input.slug);
  const payload: Record<string, unknown> = {
    id: randomUUID(),
    deal_id: dealId,
    workstream_slug: input.workstreamSlug,
    pillar_slug: input.pillarSlug ?? null,
    title: input.title,
    owner: input.owner || null,
    due: input.due || null,
    status: input.status,
    visibility: input.visibility,
    sensitivities: input.sensitivities,
  };
  let { data, error } = await sb.from("actions").insert(payload).select("*").single();
  if (error && /pillar_slug/i.test(error.message)) {
    delete payload.pillar_slug;
    ({ data, error } = await sb.from("actions").insert(payload).select("*").single());
  }
  if (error || !data) {
    if (dealRejected(error)) {
      fail("insert action: deals.slug não devolveu uuid — não inventei o deal", error);
    }
    fail("insert action", error);
  }
  const row = mapActionRow(data as Record<string, unknown>, input.dealId);
  if (!row.pillarSlug && input.pillarSlug) row.pillarSlug = input.pillarSlug;
  return row;
}

export async function updateActionRemote(
  sb: SupabaseClient,
  id: string,
  patch: Partial<Pick<ActionItem, "title" | "owner" | "due" | "pillarSlug" | "status" | "visibility">>,
): Promise<ActionItem | null> {
  const payload: Record<string, unknown> = {};
  if (patch.title != null) payload.title = patch.title;
  if (patch.owner != null) payload.owner = patch.owner || null;
  if (patch.due != null) payload.due = patch.due || null;
  if (patch.pillarSlug !== undefined) payload.pillar_slug = patch.pillarSlug;
  if (patch.status) payload.status = patch.status;
  if (patch.visibility) payload.visibility = patch.visibility;
  let { data, error } = await sb.from("actions").update(payload).eq("id", id).select("*").maybeSingle();
  if (error && /pillar_slug/i.test(error.message)) {
    delete payload.pillar_slug;
    ({ data, error } = await sb.from("actions").update(payload).eq("id", id).select("*").maybeSingle());
  }
  if (error) fail("update action", error);
  if (!data) return null;
  const canon = await dealCanon(sb);
  const row = mapActionRow(data as Record<string, unknown>, canon(String((data as { deal_id?: string }).deal_id ?? "")));
  if (!row.pillarSlug && patch.pillarSlug) row.pillarSlug = patch.pillarSlug;
  return row;
}

export async function deleteActionRemote(sb: SupabaseClient, id: string): Promise<boolean> {
  const { data, error } = await sb.from("actions").delete().eq("id", id).select("id");
  if (error) fail("delete action", error);
  return Boolean(data && data.length);
}

export async function listExtraNotesRemote(sb: SupabaseClient): Promise<Note[]> {
  const canon = await dealCanon(sb);
  const { data, error } = await sb.from("notes").select("*");
  if (error) fail("list notes", error);
  return (data ?? []).map((row) => {
    const raw = (row as { deal_id?: string | null }).deal_id;
    const dealId = raw ? canon(String(raw)) : null;
    return mapNoteRow(row as Record<string, unknown>, dealId);
  });
}

export async function addNoteRemote(
  sb: SupabaseClient,
  input: Omit<Note, "id"> & { slug: string },
): Promise<Note> {
  // O id do deal no app é texto (`deal-loopert`), como em actions e open_points.
  // Não troca por um uuid inventado.
  const payload = {
    id: randomUUID(),
    deal_id: input.dealId || null,
    body: input.body,
    visibility: input.visibility,
    sensitivities: input.sensitivities,
  };
  const { data, error } = await sb.from("notes").insert(payload).select("*").single();
  if (error || !data) fail("insert note", error);
  return mapNoteRow(data as Record<string, unknown>, input.dealId);
}

export async function updateNoteRemote(
  sb: SupabaseClient,
  id: string,
  patch: Partial<Pick<Note, "body" | "visibility">>,
): Promise<Note | null> {
  const payload: Record<string, unknown> = {};
  if (patch.body != null) payload.body = patch.body;
  if (patch.visibility) payload.visibility = patch.visibility;
  const { data, error } = await sb.from("notes").update(payload).eq("id", id).select("*").maybeSingle();
  if (error) fail("update note", error);
  if (!data) return null;
  const canon = await dealCanon(sb);
  const raw = (data as { deal_id?: string | null }).deal_id;
  return mapNoteRow(data as Record<string, unknown>, raw ? canon(String(raw)) : null);
}

export async function deleteNoteRemote(sb: SupabaseClient, id: string): Promise<boolean> {
  const { data, error } = await sb.from("notes").delete().eq("id", id).select("id");
  if (error) fail("delete note", error);
  return Boolean(data && data.length);
}

export async function unclassifiedCountRemote(sb: SupabaseClient) {
  const { count, error } = await sb
    .from("inbox_files")
    .select("id", { count: "exact", head: true })
    .eq("classified", false);
  if (error) fail("count inbox", error);
  return count ?? 0;
}
