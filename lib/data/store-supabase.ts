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
import type { ChecklistItem, Decision, DocumentStatus, DocumentType, DriveDocument, InboxFile } from "../types";
import { sanitizeDriveUrl } from "../http";
import { decisions as seedDecisions } from "./seed";
import { mapChecklistRow, mapDecisionRow, mapDocumentRow, mapInboxRow } from "./store-map";

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
    source?: "manual" | "drive";
  },
): Promise<InboxFile> {
  const row = {
    id: randomUUID(),
    name: input.name.trim(),
    source: input.source ?? "manual",
    drive_url: sanitizeDriveUrl(input.driveUrl),
    drive_id: input.driveId?.trim() || null,
    received_at: new Date().toISOString(),
    classified: false,
  };
  const { data, error } = await sb.from("inbox_files").insert(row).select("*").single();
  if (error || !data) fail("insert inbox", error);
  return mapInboxRow(data);
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

export async function unclassifiedCountRemote(sb: SupabaseClient) {
  const { count, error } = await sb
    .from("inbox_files")
    .select("id", { count: "exact", head: true })
    .eq("classified", false);
  if (error) fail("count inbox", error);
  return count ?? 0;
}
