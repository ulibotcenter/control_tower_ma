import type { MeetingMode, Milestone } from "@/lib/types";

export function Timeline({ items, mode }: { items: Milestone[]; mode: MeetingMode }) {
  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-5">
      {items.map((m) => {
        const current = m.status === "current";
        const done = m.status === "done";
        return (
          <li
            key={m.id}
            className={`paper px-3 py-3 ${current ? "border-gold bg-navy text-cream" : ""}`}
          >
            <p className={`kicker ${current ? "text-gold-2" : ""}`}>{m.window}</p>
            <p className={`mt-1 font-semibold ${current ? "text-cream" : "text-navy"}`}>
              {m.name}
            </p>
            <p className={`mt-1 text-[12px] ${current ? "text-cream/75" : "text-muted"}`}>
              {done ? "Concluída" : current ? "Estamos aqui" : "Ainda não"}
            </p>
            <p className={`mt-2 text-[13px] leading-snug ${current ? "text-cream/85" : ""}`}>
              {mode === "target" ? m.summaryTarget : m.summary}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
