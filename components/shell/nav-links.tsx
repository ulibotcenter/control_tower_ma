"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MeetingMode } from "@/lib/types";

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

  const program = { href: "/", label: "Programa" };
  const deals = [
    { href: "/deals/loopert", label: "Loopert", tone: "priority" as const },
    { href: "/deals/radio-health", label: "Radio Health", tone: "standby" as const },
  ];
  const extras = [
    { href: "/inbox", label: "Novos arquivos", show: !present && mode === "operate", badge: inboxCount },
    { href: "/decisions", label: "Decisões", show: mode !== "target" },
    { href: "/glossary", label: "Glossário", show: !present },
    { href: "/export/pack", label: "Pack", show: !present && mode === "operate" },
  ];

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);

  return (
    <nav className="-mx-0.5 flex flex-wrap items-center gap-2 overflow-x-auto pb-0.5 text-[13px]" aria-label="Principal">
      <Link
        href={program.href}
        className={`inline-flex min-h-11 items-center whitespace-nowrap px-3 py-1 sm:h-8 sm:min-h-0 sm:px-2.5 ${
          isActive("/") ? "bg-white text-navy font-semibold" : "text-cream hover:text-cyan"
        }`}
      >
        {program.label}
      </Link>
      <span className="hidden h-5 w-px bg-white/15 sm:block" aria-hidden />
      <div className="flex min-w-0 flex-1 rounded-sm border border-white/15 p-0.5 sm:flex-none">
        {deals.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-11 flex-1 items-center justify-center whitespace-nowrap px-2 text-center sm:h-8 sm:min-h-0 sm:flex-none sm:px-2.5 ${
                active
                  ? item.tone === "priority"
                    ? "bg-gold text-navy font-semibold"
                    : "bg-cyan text-navy font-semibold"
                  : "text-cream hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <span className="hidden h-5 w-px bg-white/15 sm:block" aria-hidden />
      {extras
        .filter((i) => i.show)
        .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex min-h-11 items-center whitespace-nowrap px-3 py-1 sm:h-8 sm:min-h-0 sm:px-2.5 ${
              isActive(item.href) ? "bg-white text-navy font-semibold" : "text-cream hover:text-cyan"
            }`}
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
