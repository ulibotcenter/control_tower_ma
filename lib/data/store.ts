import type { Decision, DocumentStatus, DocumentType, InboxFile } from "../types";
import { isSupabaseConfigured } from "../config";
import { createSupabaseAdmin } from "../supabase/server";
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
  if (!isSupabaseConfigured()) return null;
  return createSupabaseAdmin();
}

export async function listInbox(): Promise<InboxFile[]> {
  const sb = remote();
  return sb ? listInboxRemote(sb) : listInboxLocal();
}

export async function getInboxFile(id: string): Promise<InboxFile | null> {
  const sb = remote();
  return sb ? getInboxFileRemote(sb, id) : getInboxFileLocal(id);
}

export async function addInboxFile(input: {
  name: string;
  driveUrl?: string | null;
  driveId?: string | null;
  source?: "manual" | "drive";
}): Promise<InboxFile> {
  const sb = remote();
  return sb ? addInboxFileRemote(sb, input) : addInboxFileLocal(input);
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
  return sb ? classifyInboxFileRemote(sb, id, classification) : classifyInboxFileLocal(id, classification);
}

export async function extraDocuments() {
  const sb = remote();
  return sb ? extraDocumentsRemote(sb) : extraDocumentsLocal();
}

export async function extraChecklist() {
  const sb = remote();
  return sb ? extraChecklistRemote(sb) : extraChecklistLocal();
}

export async function listDecisions(): Promise<Decision[]> {
  const sb = remote();
  return sb ? listDecisionsRemote(sb) : listDecisionsLocal();
}

export async function getDecision(id: string): Promise<Decision | null> {
  const sb = remote();
  return sb ? getDecisionRemote(sb, id) : getDecisionLocal(id);
}

export async function addDecision(input: Omit<Decision, "id">): Promise<Decision> {
  const sb = remote();
  return sb ? addDecisionRemote(sb, input) : addDecisionLocal(input);
}

export async function unclassifiedCount() {
  const sb = remote();
  return sb ? unclassifiedCountRemote(sb) : unclassifiedCountLocal();
}
