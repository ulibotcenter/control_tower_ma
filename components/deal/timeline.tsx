import { memo } from "react";
import { WithTerms } from "@/components/ui/with-terms";
import type { MeetingMode, Milestone } from "@/lib/types";

function lane(m: Milestone, index: number, items: Milestone[]) {
  if (m.status === "done") return "done" as const;
  if (m.status === "current") return "now" as const;
  const prev = items[index - 1];
  if (prev?.status === "current") return "next" as const;
  return "later" as const;
}

const LANE = {
  done: { badge: "Concluído", cls: "border-go/40 bg-go/5", bar: "bg-go" },
  now: { badge: "Estamos aqui", cls: "border-gold bg-navy text-cream", bar: "bg-gold" },
  next: { badge: "Próximo", cls: "border-cyan bg-cyan/10", bar: "bg-cyan" },
  later: { badge: "Ainda não", cls: "", bar: "bg-line" },
};

export const Timeline = memo(function Timeline({
  items,
  mode,
}: {
  items: Milestone[];
  mode: MeetingMode;
}) {
  if (!items.length) {
    return (
      <p className="paper px-4 py-6 text-center text-sm text-muted">
        Nenhum marco nesta operação ainda.
      </p>
    );
  }

  const done = items.filter((m) => m.status === "done").length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
        <p>
          Progresso · {done} de {items.length} marcos concluídos
        </p>
        <p className="hidden sm:block">Concluído · em curso · próximo · ainda não</p>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full bg-gradient-to-r from-go to-gold"
          style={{ width: `${Math.max(8, (done / items.length) * 100)}%` }}
        />
      </div>
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((m, i) => {
          const k = lane(m, i, items);
          const look = LANE[k];
          const current = k === "now";
          return (
            <li key={m.id} className={`paper relative px-3 py-3 ${look.cls}`}>
              <span className={`absolute inset-x-3 top-0 h-0.5 ${look.bar}`} aria-hidden />
              <p className={`kicker ${current ? "text-gold-2" : k === "next" ? "text-navy" : ""}`}>
                {m.window}
              </p>
              <p className={`mt-1 font-semibold ${current ? "text-cream" : "text-navy"}`}>{m.name}</p>
              <p
                className={`mt-1 text-[11px] font-semibold uppercase tracking-wide ${
                  current ? "text-gold-2" : k === "done" ? "text-go" : k === "next" ? "text-navy" : "text-muted"
                }`}
              >
                {look.badge}
              </p>
              <p className={`mt-2 text-[13px] leading-snug ${current ? "text-cream/85" : "text-muted"}`}>
                <WithTerms text={mode === "target" ? m.summaryTarget : m.summary} />
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
});
