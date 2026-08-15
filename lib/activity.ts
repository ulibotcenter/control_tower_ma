import { LOOPERT_ID } from "./data/seed";
import type { ActivityEvent, Decision, InboxFile, MeetingMode } from "./types";
import { filterVisible } from "./visibility";

/**
 * Feed de «o que aconteceu».
 *
 * HOJE: decisões (store/seed), arquivos da bandeja, e fatos do corte
 * que têm data oficial. Sem inventar timestamp.
 *
 * REAL: tabela `activity_events` (ver DATA_ORIGIN.activity).
 * Manter o shape ActivityEvent.
 */
const SEED_FACTS: ActivityEvent[] = [
  {
    id: "act-municipal",
    at: "2026-06-02",
    kind: "risk",
    title: "Certidão municipal da Loopert venceu",
    who: "Loopert",
    dealId: LOOPERT_ID,
    dealName: "Loopert",
    href: "/deals/loopert#riscos",
    visibility: "target",
    sensitivities: [],
  },
];

const KIND_LABEL: Record<ActivityEvent["kind"], string> = {
  decision: "Decisão",
  document: "Documento",
  action: "Ação",
  risk: "Risco",
};

export function activityKindLabel(kind: ActivityEvent["kind"]) {
  return KIND_LABEL[kind];
}

export function collectActivity(input: {
  decisions: Decision[];
  inbox: InboxFile[];
  dealName: (id: string | null) => string;
}): ActivityEvent[] {
  const fromDecisions: ActivityEvent[] = input.decisions.map((d) => ({
    id: `dec-${d.id}`,
    at: d.date,
    kind: "decision",
    title: d.decisionTaken,
    who: d.whoLabel,
    dealId: d.dealId,
    dealName: input.dealName(d.dealId),
    href: "/decisions",
    visibility: "advisors",
    sensitivities: [],
  }));

  const fromInbox: ActivityEvent[] = input.inbox.map((f) => ({
    id: `inbox-${f.id}`,
    at: f.receivedAt.slice(0, 10),
    kind: "document",
    title: f.classified
      ? `Arquivo classificado · ${f.name}`
      : `Arquivo na bandeja · ${f.name}`,
    who: f.source === "drive" ? "Drive" : "Registro manual",
    dealId: f.classification?.dealId ?? null,
    dealName: f.classification?.dealId ? input.dealName(f.classification.dealId) : undefined,
    href: f.classified ? "/inbox" : `/inbox/${f.id}`,
    visibility: "operate",
    sensitivities: [],
  }));

  const facts = SEED_FACTS.map((f) => ({
    ...f,
    dealName: f.dealId ? input.dealName(f.dealId) : f.dealName,
  }));

  return [...fromDecisions, ...fromInbox, ...facts].sort((a, b) =>
    a.at < b.at ? 1 : a.at > b.at ? -1 : 0,
  );
}

export function visibleActivity(items: ActivityEvent[], mode: MeetingMode, limit = 8) {
  return filterVisible(mode, items).slice(0, limit);
}
