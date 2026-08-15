import Link from "next/link";
import { activityKindLabel } from "@/lib/activity";
import { formatDate } from "@/lib/format";
import type { ActivityEvent } from "@/lib/types";
import { WithTerms } from "@/components/ui/with-terms";


export function ActivityFeed({
  items,
  compact = false,
}: {
  items: ActivityEvent[];
  compact?: boolean;
}) {
  return (
    <section className="paper flex h-full flex-col p-5">
      <p className="kicker">Desde a última visita</p>
      <h2 className="serif mt-1 text-2xl text-navy">Atividade recente</h2>
      <p className="mt-1 text-[13px] text-muted">
        Decisões, arquivos e fatos com data. Sem inventar o que não está no corte.
      </p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Nada novo neste recorte. Quando o board decidir ou um arquivo entrar na bandeja, o
          registro aparece aqui.
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="block rounded-sm hover:bg-cream-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {formatDate(item.at)}
                  {item.who ? ` · ${item.who}` : ""}
                  {item.dealName ? ` · ${item.dealName}` : ""}
                </p>
                <p className={`mt-0.5 leading-snug text-navy ${compact ? "text-sm" : "text-[15px]"}`}>
                  <span className="text-[#c2410c]">{activityKindLabel(item.kind)}</span>
                  <span className="text-muted"> · </span>
                  <WithTerms text={item.title} interactive={false} />
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
