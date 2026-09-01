import { Term } from "@/components/ui/term";
import { WithTerms } from "@/components/ui/with-terms";
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

  // A âncora #tese pertence à sala da Eleva, que envolve este bloco.
  return (
    <div className="space-y-4">
      <div className="paper p-5">
        <h3 className="text-[15px] font-semibold text-navy">Evolução da tese</h3>
        <p className="mt-1 text-sm text-muted">
          Histórico falado na sala. Nada disto é <Term id="loi">LOI</Term>. Nada disto é{" "}
          <Term id="valuation">valuation</Term> fechado.
        </p>
        <ol className="mt-4 space-y-2">
          {thesis.map((t) => (
            <li
              key={t.id}
              className={`flex flex-wrap items-baseline gap-3 border-l-2 pl-3 ${
                t.current ? "border-brand" : "border-line"
              }`}
            >
              <span className="font-mono text-[12px] text-muted">{t.date}</span>
              <span className={t.current ? "font-semibold text-navy" : ""}>
                <WithTerms text={t.label} />
              </span>
              {t.current && <span className="stamp text-brand">Atual (10/08)</span>}
            </li>
          ))}
        </ol>
      </div>
      <div className="paper p-5">
        <h3 className="text-[15px] font-semibold text-navy">
          Trajetória de preço — verbal, suspensa desde 15/06
        </h3>
        <p className="mt-1 text-sm text-muted">
          Não há <Term id="valuation">valuation</Term> fechado. Rafaella: pode ser ~R$ 1M / ~R$ 600k.
          Board ainda não fechou <Term id="envelope">envelope</Term>.
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
    </div>
  );
}
