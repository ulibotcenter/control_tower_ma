import type { PriceStep, ThesisStep } from "@/lib/types";

export function ThesisPrice({
  thesis,
  prices,
  hidden,
}: {
  thesis: ThesisStep[];
  prices: PriceStep[];
  hidden: boolean;
}) {
  if (hidden) return null;

  return (
    <section id="tese" className="space-y-4">
      <div className="paper p-5">
        <p className="kicker">Evolução da tese</p>
        <p className="mt-1 text-sm text-muted">
          Histórico falado na sala. Nada disto é LOI. Nada disto é valuation fechado.
        </p>
        <ol className="mt-4 space-y-2">
          {thesis.map((t) => (
            <li
              key={t.id}
              className={`flex flex-wrap items-baseline gap-3 border-l-2 pl-3 ${
                t.current ? "border-gold" : "border-line"
              }`}
            >
              <span className="font-mono text-[12px] text-muted">{t.date}</span>
              <span className={t.current ? "font-semibold text-navy" : ""}>{t.label}</span>
              {t.current && <span className="stamp text-gold">Atual (10/08)</span>}
            </li>
          ))}
        </ol>
      </div>
      <div className="paper p-5">
        <p className="kicker">Trajetória de preço — verbal, suspensa desde 15/06</p>
        <p className="mt-1 text-sm text-muted">
          Não há valuation fechado. Rafaella: pode ser ~R$ 1M / ~R$ 600k. Board ainda não fechou
          envelope.
        </p>
        <ol className="mt-4 flex flex-wrap gap-2">
          {prices.map((p) => (
            <li
              key={p.id}
              className={`px-3 py-2 text-sm ${
                p.current ? "bg-navy text-cream" : "bg-cream-2 text-ink"
              }`}
            >
              <span className="block font-mono text-[11px] opacity-70">{p.date}</span>
              {p.label}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
