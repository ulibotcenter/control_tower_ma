"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MeetingMode } from "@/lib/types";

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

/**
 * `onlyDeal` vem do modo Alvo: a operação que não está na sala nem aparece
 * como link. Loopert não vê Radio Health e vice-versa.
 */
export function DealPick({
  deals,
  onlyDeal = null,
}: {
  deals: { slug: string; name: string }[];
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
            className={active ? (deal.slug === "loopert" ? "is-loopert" : "is-health") : undefined}
          >
            {deal.name}
          </Link>
        );
      })}
    </div>
  );
}

export function NavLinks({
  mode,
  inboxCount,
  present = false,
}: {
  mode: MeetingMode;
  inboxCount: number;
  present?: boolean;
}) {
  const path = usePathname();
  // `quiet`: fica de apoio. Em Operar quem manda é o seletor de operação —
  // Programa e Glossário são saídas de contexto, não o caminho principal.
  const extras = [
    { href: "/", label: "Programa", show: true, quiet: true },
    { href: "/inbox", label: "Novos arquivos", show: !present && mode === "operate", badge: inboxCount },
    { href: "/decisions", label: "Decisões", show: mode !== "target" },
    { href: "/glossary", label: "Glossário", show: !present, quiet: true },
    { href: "/export/pack", label: "Pack", show: !present && mode === "operate" },
  ];

  return (
    <nav className="nav-sec flex flex-wrap items-center gap-0.5 overflow-x-auto" aria-label="Secundária">
      {extras
        .filter((i) => i.show)
        .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              isActive(path, item.href) ? "is-on" : "",
              item.quiet && !isActive(path, item.href) ? "opacity-60" : "",
            ]
              .filter(Boolean)
              .join(" ") || undefined}
          >
            {item.label}
            {item.badge ? (
              <span className="ml-1.5 bg-alert px-1.5 py-0.5 text-[11px] font-semibold text-cream">
                {item.badge}
              </span>
            ) : null}
          </Link>
        ))}
    </nav>
  );
}
