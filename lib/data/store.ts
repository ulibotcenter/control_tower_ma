import type { Decision, DocumentStatus, DocumentType, InboxFile } from "../types";
import { forbidLocalStore, isSupabaseConfigured } from "../config";
import { createSupabaseAdmin } from "../supabase/server";
import { decisions as seedDecisions } from "./seed";
import {
  addDecisionLocal,
  addInboxFileLocal,
  classifyInboxFileLocal,
  extraChecklistLocal,
  extraDocumentsLocal,
  getDecisionLocal,
  getInboxFileLocal,
  listDecisionsLocal,
  listInboxLocal,
  unclassifiedCountLocal,
} from "./store-local";
import {
  addDecisionRemote,
  addInboxFileRemote,
  classifyInboxFileRemote,
  extraChecklistRemote,
  extraDocumentsRemote,
  getDecisionRemote,
  getInboxFileRemote,
  listDecisionsRemote,
  listInboxRemote,
  unclassifiedCountRemote,
} from "./store-supabase";

function remote() {
  return createSupabaseAdmin();
}

function refuseLocalWrite(kind: string): never {
  const msg =
    `[data] ${kind}: Supabase não está ligado neste host (precisa NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY). ` +
    `Em Vercel não usamos .data/store.json.`;
  console.error(msg, {
    configured: isSupabaseConfigured(),
    vercel: process.env.VERCEL ?? null,
    node: process.env.NODE_ENV,
  });
  throw new Error(msg);
}

export async function listInbox(): Promise<InboxFile[]> {
  const sb = remote();
  if (sb) return listInboxRemote(sb);
  if (forbidLocalStore()) return [];
  return listInboxLocal();
}

export async function getInboxFile(id: string): Promise<InboxFile | null> {
  const sb = remote();
  if (sb) return getInboxFileRemote(sb, id);
  if (forbidLocalStore()) return null;
  return getInboxFileLocal(id);
}

export async function addInboxFile(input: {
  name: string;
  driveUrl?: string | null;
  driveId?: string | null;
  source?: "manual" | "drive";
}): Promise<InboxFile> {
  const sb = remote();
  if (sb) return addInboxFileRemote(sb, input);
  if (forbidLocalStore()) refuseLocalWrite("addInboxFile");
  return addInboxFileLocal(input);
}

export async function classifyInboxFile(
  id: string,
  classification: {
    dealId: string;
    type: DocumentType;
    workstreamSlug: string | null;
    status: DocumentStatus;
  },
): Promise<InboxFile | null> {
  const sb = remote();
  if (sb) return classifyInboxFileRemote(sb, id, classification);
  if (forbidLocalStore()) refuseLocalWrite("classifyInboxFile");
  return classifyInboxFileLocal(id, classification);
}

export async function extraDocuments() {
  const sb = remote();
  if (sb) return extraDocumentsRemote(sb);
  if (forbidLocalStore()) return [];
  return extraDocumentsLocal();
}

export async function extraChecklist() {
  const sb = remote();
  if (sb) return extraChecklistRemote(sb);
  if (forbidLocalStore()) return [];
  return extraChecklistLocal();
}

export async function listDecisions(): Promise<Decision[]> {
  const sb = remote();
  if (sb) {
    const rows = await listDecisionsRemote(sb);
    console.info("[data] listDecisions supabase", rows.length);
    return rows;
  }
  if (forbidLocalStore()) {
    console.warn("[data] listDecisions seed only — Supabase ausente em produção");
    return [...seedDecisions].sort((a, b) => (a.date < b.date ? 1 : -1));
  }
  return listDecisionsLocal();
}

export async function getDecision(id: string): Promise<Decision | null> {
  const sb = remote();
  if (sb) return getDecisionRemote(sb, id);
  if (forbidLocalStore()) return seedDecisions.find((d) => d.id === id) ?? null;
  return getDecisionLocal(id);
}

export async function addDecision(input: Omit<Decision, "id">): Promise<Decision> {
  const sb = remote();
  if (sb) return addDecisionRemote(sb, input);
  if (forbidLocalStore()) refuseLocalWrite("addDecision");
  return addDecisionLocal(input);
}

export async function unclassifiedCount() {
  const sb = remote();
  if (sb) return unclassifiedCountRemote(sb);
  if (forbidLocalStore()) return 0;
  return unclassifiedCountLocal();
}
