import type { ActionItem, AttentionItem, Deal, MeetingMode, Risk } from "./types";
import { filterVisible } from "./visibility";

/**
 * Itens que pedem ação imediata: ações atrasadas + riscos críticos.
 * A lista já respeita o modo (Alvo não vê TARGA/SJDC/NDA Eleva, etc.).
 *
 * MOCK: `actions` e `risks` vêm do seed (ver lib/data/sources.ts).
 * REAL: a mesma função, com as duas coleções lidas do Supabase.
 */
export function collectAttention(
  input: {
    actions: ActionItem[];
    risks: Risk[];
    deals: Deal[];
  },
  mode: MeetingMode,
): AttentionItem[] {
  const dealById = new Map(input.deals.map((d) => [d.id, d]));

  const late = filterVisible(
    mode,
    input.actions.filter((a) => a.status === "late"),
  );
  const reds = filterVisible(
    mode,
    input.risks.filter((r) => r.severity === "red"),
  );

  const fromActions: AttentionItem[] = late.flatMap((a) => {
    const deal = dealById.get(a.dealId);
    if (!deal) return [];
    return [
      {
        id: a.id,
        kind: "late_action" as const,
        dealId: deal.id,
        dealSlug: deal.slug,
        dealName: deal.name,
        dealPriority: deal.priority,
        title: a.title,
        href: `/deals/${deal.slug}#acoes`,
        meta: a.owner,
      },
    ];
  });

  const fromRisks: AttentionItem[] = reds.flatMap((r) => {
    const deal = dealById.get(r.dealId);
    if (!deal) return [];
    return [
      {
        id: r.id,
        kind: "critical_risk" as const,
        dealId: deal.id,
        dealSlug: deal.slug,
        dealName: deal.name,
        dealPriority: deal.priority,
        title: r.title,
        href: `/deals/${deal.slug}#riscos`,
        meta: r.workstreamSlug ?? undefined,
      },
    ];
  });

  const rank = (item: AttentionItem) =>
    item.dealPriority * 10 + (item.kind === "late_action" ? 0 : 1);

  return [...fromActions, ...fromRisks].sort((a, b) => rank(a) - rank(b));
}

export function attentionSummary(items: AttentionItem[]) {
  const late = items.filter((i) => i.kind === "late_action").length;
  const reds = items.filter((i) => i.kind === "critical_risk").length;
  const n = items.length;
  const headline =
    n === 0
      ? "Nada exige atenção imediata"
      : n === 1
        ? "1 item precisa de atenção"
        : `${n} itens precisam de atenção`;
  return { n, late, reds, headline };
}
