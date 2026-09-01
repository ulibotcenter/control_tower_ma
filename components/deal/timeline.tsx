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
  done: { badge: "Concluído" },
  now: { badge: "Estamos aqui" },
  next: { badge: "Próximo" },
  later: { badge: "Ainda não" },
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
      <p className="mb-2 text-[13px] text-muted">
        {done} de {items.length} marcos concluídos
      </p>
      {/*
       * Peça única: uma faixa com divisórias internas, não cinco cartões
       * soltos. A etapa em curso é a única cheia — as outras ficam calmas.
       */}
      <ol className="timeline">
        {items.map((m, i) => {
          const k = lane(m, i, items);
          const current = k === "now";
          return (
            <li key={m.id} className={`timeline-step${current ? " is-now" : ""}`} data-lane={k}>
              <p className="timeline-window">{m.window}</p>
              <p className="timeline-name">{m.name}</p>
              <p className="timeline-badge">{LANE[k].badge}</p>
              <p className="timeline-note">
                <WithTerms text={mode === "target" ? m.summaryTarget : m.summary} />
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
});
