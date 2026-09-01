import Link from "next/link";
import { attentionSummary } from "@/lib/attention";
import type { AttentionItem } from "@/lib/types";
import { WithTerms } from "@/components/ui/with-terms";

/**
 * Atenção no trilho da home, compacto. Substitui a tarja vermelha de largura
 * inteira que ficava entre o cabeçalho e o conteúdo: instrumento, não alarme.
 */
export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  const { late, reds } = attentionSummary(items);

  return (
    <section className="paper p-4" aria-label="Atenção prioritária">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-semibold tracking-tight text-navy">Atenção</h2>
        {items.length > 0 && (
          <span className="text-[12px] tabular-nums text-muted">
            {late} atrasada{late === 1 ? "" : "s"} · {reds} crítico{reds === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-2 text-[13px] leading-snug text-muted">
          Nada exige ação imediata. Ações vencidas e riscos críticos aparecem aqui.
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {items.slice(0, 6).map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="group block">
                <span className="flex gap-2">
                  <span
                    className={`dot mt-1.5 shrink-0 ${
                      item.kind === "critical_risk" ? "dot-red" : "dot-amber"
                    }`}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] leading-snug text-navy group-hover:text-brand">
                      <WithTerms text={item.title} interactive={false} />
                    </span>
                    <span className="block text-[12px] text-muted">
                      {item.dealName}
                      {item.meta ? ` · ${item.meta}` : ""}
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
