"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MeetingMode } from "@/lib/types";

export function NavLinks({ mode, inboxCount }: { mode: MeetingMode; inboxCount: number }) {
  const path = usePathname();

  const items = [
    { href: "/", label: "Programa", show: true },
    { href: "/deals/loopert", label: "Loopert", show: true },
    { href: "/deals/radio-health", label: "Radio Health", show: true },
    { href: "/inbox", label: "Novos arquivos", show: mode === "operate", badge: inboxCount },
    { href: "/decisions", label: "Decisões", show: mode !== "target" },
    { href: "/export/pack", label: "Pack", show: mode === "operate" },
  ];

  return (
    <nav className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[13px] overflow-x-auto">
      {items
        .filter((i) => i.show)
        .map((item) => {
          const active =
            item.href === "/"
              ? path === "/"
              : path === item.href || path.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap px-2.5 py-1 ${
                active ? "bg-gold text-navy font-semibold" : "text-cream/80 hover:text-gold"
              }`}
            >
              {item.label}
              {item.badge ? (
                <span className="ml-1.5 bg-alert px-1.5 py-0.5 text-[11px] font-semibold text-cream">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
    </nav>
  );
}
