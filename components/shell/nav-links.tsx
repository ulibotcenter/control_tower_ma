"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { MeetingMode, Semaphore } from "@/lib/types";
import { DriveSyncButton } from "./drive-sync-button";
import { focusSlugFromQuery, hrefWithDeal, isFocusRoute } from "./focus-deal";
import { canSeeInbox } from "@/lib/visibility";

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

/**
 * Seletor de operação: instrumento, não dois botões de site. Cada posição
 * carrega o semáforo da operação, então trocar de deal já informa antes do
 * clique. `onlyDeal` vem do modo Alvo — a operação que não está na sala nem
 * aparece como link.
 */
/** Nome da operação na barra da apresentação. Sem o seletor largo. */
export function PresentDealName({
  deals,
  onlyDeal = null,
}: {
  deals: { slug: string; name: string }[];
  onlyDeal?: string | null;
}) {
  const path = usePathname();
  const visible = onlyDeal ? deals.filter((d) => d.slug === onlyDeal) : deals;
  const fromPath = visible.find((d) => path.startsWith(`/deals/${d.slug}`));
  const name = fromPath?.name ?? (visible.length === 1 ? visible[0].name : null);
  if (!name) return null;
  return <p className="hdr-present-deal">{name}</p>;
}

export function DealPick({
  deals,
  onlyDeal = null,
}: {
  deals: { slug: string; name: string; health?: Semaphore }[];
  onlyDeal?: string | null;
}) {
  const path = usePathname();
  const params = useSearchParams();
  const visible = onlyDeal ? deals.filter((d) => d.slug === onlyDeal) : deals;
  if (visible.length === 0) return null;
  const stay = isFocusRoute(path);
  const focused = focusSlugFromQuery(params.get("deal"));

  return (
    <div className="deal-pick" role="tablist" aria-label="Operações">
      {visible.map((deal) => {
        const href = stay ? hrefWithDeal(path, deal.slug, params.toString()) : `/deals/${deal.slug}`;
        const active = path.startsWith("/deals/")
          ? isActive(path, `/deals/${deal.slug}`)
          : focused === deal.slug;
        return (
          <Link
            key={deal.slug}
            href={href}
            role="tab"
            aria-selected={active}
            className={active ? "is-on" : undefined}
          >
            {deal.health && (
              <span className={`deal-pick-dot dot-${deal.health}`} aria-hidden />
            )}
            {deal.name}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Faixa de trabalho, fora do cabeçalho. Só em Operar, e nunca na apresentação.
 * Glossário não compete aqui — fica na sidebar de produto e no painel de atalhos.
 */
export function WorkNav({
  mode,
  inboxCount,
}: {
  mode: MeetingMode;
  inboxCount: number;
}) {
  const path = usePathname();
  const params = useSearchParams();
  if (!canSeeInbox(mode)) return null;
  const fromDeal = path.match(/^\/deals\/([^/]+)/)?.[1] ?? null;
  const focus = focusSlugFromQuery(fromDeal) ?? focusSlugFromQuery(params.get("deal"));

  const items = [
    { href: "/inbox", label: "Bandeja", badge: inboxCount },
    { href: "/decisions", label: "Decisões" },
    { href: "/export/pack", label: "Pack" },
  ];

  return (
    <div className="work-nav no-print">
      <nav className="px-3 sm:px-4" aria-label="Trabalho">
        {items.map((item) => (
          <Link
            key={item.href}
            href={focus ? `${item.href}?deal=${encodeURIComponent(focus)}` : item.href}
            className={isActive(path, item.href) ? "is-on" : undefined}
          >
            {item.label}
            {item.badge ? (
              <span className="ml-1.5 bg-alert px-1.5 py-0.5 text-[11px] font-semibold text-cream">
                {item.badge}
              </span>
            ) : null}
          </Link>
        ))}
        <DriveSyncButton variant="work" />
      </nav>
    </div>
  );
}
