"use client";

import { useId, useState } from "react";
import Link from "next/link";
import type { AttentionItem } from "@/lib/types";
import { attentionSummary } from "@/lib/attention";
import { WithTerms } from "@/components/ui/with-terms";

export function AttentionStrip({ items }: { items: AttentionItem[] }) {
  const { n, late, reds, headline } = attentionSummary(items);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (n === 0) return null;

  return (
    <section
      className="border-b border-alert/30 bg-[#fdf4f3]"
      aria-label="Atenção prioritária"
    >
      <div className="mx-auto max-w-6xl px-4 py-2.5">
        <div className="no-print flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-navy">
            <span className="mr-2 inline-flex items-center bg-alert px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-cream">
              Atenção
            </span>
            {headline}
            <span className="mt-1 block font-normal text-[#5c3a36] sm:mt-0 sm:ml-2 sm:inline">
              {late ? `${late} atrasada${late === 1 ? "" : "s"}` : ""}
              {late && reds ? " · " : ""}
              {reds ? `${reds} risco${reds === 1 ? "" : "s"} crítico${reds === 1 ? "" : "s"}` : ""}
            </span>
          </p>
          <button
            type="button"
            className="min-h-11 px-3 text-[13px] font-semibold text-alert underline-offset-2 hover:underline sm:min-h-0 sm:px-0"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Recolher" : "Ver itens"}
          </button>
        </div>

        <div id={panelId} hidden={!open} className="no-print">
          {open ? <AttentionList items={items} /> : null}
        </div>

        <div className="hidden print:block">
          <p className="text-sm font-semibold text-navy">
            Atenção · {headline}
          </p>
          <AttentionList items={items} />
        </div>
      </div>
    </section>
  );
}

function AttentionList({ items }: { items: AttentionItem[] }) {
  const late = items.filter((i) => i.kind === "late_action");
  const reds = items.filter((i) => i.kind === "critical_risk");

  return (
    <div className="mt-3 grid gap-4 sm:grid-cols-2">
      {late.length > 0 && (
        <Group title="Ações atrasadas" items={late} />
      )}
      {reds.length > 0 && (
        <Group title="Riscos críticos" items={reds} />
      )}
    </div>
  );
}

function Group({ title, items }: { title: string; items: AttentionItem[] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a2f28]">
        {title}
      </p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="block text-[13px] leading-snug text-navy hover:text-alert"
            >
              <span className="font-medium">
                <WithTerms text={item.title} interactive={false} />
              </span>
              <span className="text-[#5c3a36]">
                {" "}
                · {item.dealName}
                {item.meta ? ` · ${item.meta}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
