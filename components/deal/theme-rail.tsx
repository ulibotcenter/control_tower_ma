import Link from "next/link";
import {
  kindLabel,
  pilarNome,
  temaCount,
  temaHits,
  temaNome,
  TEMAS,
  type TemaSlug,
} from "@/lib/data/temas";
import { WithTerms } from "@/components/ui/with-terms";
import type { DealBundle } from "@/lib/types";

export function ThemeRail({
  bundle,
  tema,
}: {
  bundle: DealBundle;
  tema: TemaSlug | null;
}) {
  const slug = bundle.deal.slug;

  return (
    <section id="temas" className="theme-filter war-block">
      <p className="theme-filter-label">Filtrar por tema</p>
      <nav className="chip-row" aria-label="Filtrar por tema">
        {TEMAS.map((t) => {
          const n = temaCount(bundle, t.slug);
          const on = tema === t.slug;
          if (n === 0) {
            return (
              <span
                key={t.slug}
                className="chip is-off"
                aria-disabled="true"
                title={t.slug === "cultura" ? "Ainda sem fato" : undefined}
              >
                {t.name}
                {t.slug === "cultura" ? (
                  <span className="chip-count">ainda sem fato</span>
                ) : (
                  <span className="chip-count">0</span>
                )}
              </span>
            );
          }
          return (
            <Link
              key={t.slug}
              href={on ? `/deals/${slug}` : `/deals/${slug}?tema=${t.slug}`}
              className={`chip${on ? " is-on" : ""}`}
            >
              {t.name}
              <span className="chip-count">{n}</span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

export function ThemePanel({
  bundle,
  tema,
  target,
}: {
  bundle: DealBundle;
  tema: TemaSlug;
  target: boolean;
}) {
  const { items, total } = temaHits(bundle, tema);
  const mais = total - items.length;

  return (
    <section className="paper mb-6 px-4 py-4" aria-labelledby="neste-tema">
      <h2 id="neste-tema" className="text-[15px] font-semibold tracking-tight text-navy">
        Neste tema · {temaNome(tema)}
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-[14px] text-muted">Ainda sem fato neste tema.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {items.map((hit) => (
            <li key={`${hit.kind}-${hit.id}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {kindLabel(hit.kind, target)}
              </span>
              <span className="min-w-0 flex-1 text-[14px] leading-snug text-navy">
                <WithTerms text={hit.title} />
              </span>
              <Link
                href={`/deals/${bundle.deal.slug}/${hit.pillar}`}
                className="text-[13px] text-muted underline decoration-line-2 underline-offset-4 hover:text-brand"
              >
                {pilarNome(hit.pillar)}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {mais > 0 && (
        <p className="mt-2 text-[12px] text-muted">
          +{mais} neste tema. Abra o pilar para a lista completa.
        </p>
      )}
    </section>
  );
}
