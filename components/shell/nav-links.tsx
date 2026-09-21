"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MeetingMode, Semaphore } from "@/lib/types";
import { DriveSyncButton } from "./drive-sync-button";
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
export function DealPick({
  deals,
  onlyDeal = null,
}: {
  deals: { slug: string; name: string; health?: Semaphore }[];
  onlyDeal?: string | null;
}) {
  const path = usePathname();
  const visible = onlyDeal ? deals.filter((d) => d.slug === onlyDeal) : deals;
  if (visible.length === 0) return null;

  return (
    <div className="deal-pick" role="tablist" aria-label="Operações">
      {visible.map((deal) => {
        const href = `/deals/${deal.slug}`;
        const active = isActive(path, href);
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
  if (!canSeeInbox(mode)) return null;

  const items = [
    { href: "/inbox", label: "Bandeja", badge: inboxCount },
    { href: "/decisions", label: "Decisões" },
    { href: "/export/pack", label: "Pack" },
  ];

  return (
    <div className="work-nav no-print">
      <nav className="px-3 sm:px-4" aria-label="Trabalho">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={isActive(path, item.href) ? "is-on" : undefined}>
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
