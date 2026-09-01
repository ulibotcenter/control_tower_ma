import { WithTerms } from "@/components/ui/with-terms";
import { MODE_META } from "@/lib/mode-meta";
import type { BoardCard as BoardCardType, MeetingMode } from "@/lib/types";

export function BoardCard({
  card,
  mode,
}: {
  card: BoardCardType;
  mode: MeetingMode;
}) {
  const target = mode === "target";
  return (
    <section className="rounded-md border border-navy-3 bg-navy px-5 py-5 text-cream sm:px-7 sm:py-6">
      <p className="kicker !text-brand-2">{MODE_META[mode].boardKicker}</p>
      <p className="serif mt-2 text-2xl leading-snug sm:text-3xl">
        <WithTerms text={target ? card.sentenceTarget : card.sentence} />
      </p>
      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm text-cream/85">
        <span>
          <span className="text-brand-2">Dono</span> · {card.owner}
        </span>
        <span>
          <span className="text-brand-2">Data</span> · {card.date}
        </span>
      </div>
    </section>
  );
}
