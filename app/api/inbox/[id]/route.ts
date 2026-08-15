import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMode } from "@/lib/mode";
import { canSeeInbox } from "@/lib/visibility";
import { classifyInboxFile } from "@/lib/data/store";
import { deals, workstreams } from "@/lib/data/seed";
import type { DocumentStatus, DocumentType } from "@/lib/types";

const TYPES: DocumentType[] = ["nda", "ata", "transcricao", "contrato", "financeiro", "outro"];
const STATUSES: DocumentStatus[] = ["rascunho", "assinado", "vigente", "vencido"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const mode = await getMode();
  if (!canSeeInbox(mode)) return NextResponse.json({ error: "hidden" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json()) as {
    dealId?: string;
    type?: DocumentType;
    workstreamSlug?: string;
    status?: DocumentStatus;
  };

  const dealId = body.dealId;
  const type = body.type;
  const status = body.status;
  const workstreamSlug = body.workstreamSlug;
  const knownDeal = Boolean(dealId && deals.some((d) => d.id === dealId));
  const knownWs = Boolean(
    dealId &&
      workstreamSlug &&
      workstreams.some((w) => w.dealId === dealId && w.slug === workstreamSlug),
  );
  const knownType = Boolean(type && TYPES.includes(type));
  const knownStatus = Boolean(status && STATUSES.includes(status));
  if (!dealId || !knownDeal || !type || !knownType || !status || !knownStatus || !workstreamSlug || !knownWs) {
    return NextResponse.json({ error: "fields" }, { status: 400 });
  }

  const file = await classifyInboxFile(id, {
    dealId,
    type,
    workstreamSlug,
    status,
  });

  if (!file) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ file });
}
