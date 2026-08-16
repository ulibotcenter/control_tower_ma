"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MeetingMode } from "@/lib/types";

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

export function DealPick() {
  const path = usePathname();
  return (
    <div className="deal-pick" role="tablist" aria-label="Operações">
      <Link
        href="/deals/loopert"
        role="tab"
        aria-selected={isActive(path, "/deals/loopert")}
        className={isActive(path, "/deals/loopert") ? "is-loopert" : undefined}
      >
        Loopert
      </Link>
      <Link
        href="/deals/radio-health"
        role="tab"
        aria-selected={isActive(path, "/deals/radio-health")}
        className={isActive(path, "/deals/radio-health") ? "is-health" : undefined}
      >
        Radio Health
      </Link>
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
  const extras = [
    { href: "/", label: "Programa", show: true },
    { href: "/inbox", label: "Novos arquivos", show: !present && mode === "operate", badge: inboxCount },
    { href: "/decisions", label: "Decisões", show: mode !== "target" },
    { href: "/glossary", label: "Glossário", show: !present },
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
    </nav>
  );
}
