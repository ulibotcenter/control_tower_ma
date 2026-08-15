import type { BoardCard as BoardCardType } from "@/lib/types";

export function BoardCard({
  card,
  target,
}: {
  card: BoardCardType;
  target?: boolean;
}) {
  return (
    <section className="border border-gold bg-navy text-cream px-5 py-5 sm:px-7 sm:py-6">
      <p className="kicker">Próxima decisão do board</p>
      <p className="serif mt-2 text-2xl sm:text-3xl leading-snug">
        {target ? card.sentenceTarget : card.sentence}
      </p>
      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm text-cream/75">
        <span>
          <span className="text-gold">Dono</span> · {card.owner}
        </span>
        <span>
          <span className="text-gold">Data</span> · {card.date}
        </span>
      </div>
    </section>
  );
}
