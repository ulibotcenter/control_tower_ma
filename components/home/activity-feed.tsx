import Link from "next/link";
import { activityKindLabel } from "@/lib/activity";
import { formatDate } from "@/lib/format";
import { TARGET_COPY } from "@/lib/mode-meta";
import type { ActivityEvent, MeetingMode } from "@/lib/types";
import { WithTerms } from "@/components/ui/with-terms";

/**
 * `variant="rail"`: coluna estreita da home, poucas linhas, sem moldura.
 * `variant="page"`: bloco de rodapé em largura cheia.
 */
export function ActivityFeed({
  items,
  mode,
  variant = "page",
}: {
  items: ActivityEvent[];
  mode: MeetingMode;
  variant?: "rail" | "page";
}) {
  const target = mode === "target";
  const rail = variant === "rail";
  const rows = rail ? items.slice(0, 5) : items;

  return (
    <section className={rail ? "paper p-4" : "border-t border-line pt-6"}>
      <h2
        className={
          rail
            ? "text-[13px] font-semibold tracking-tight text-navy"
            : "text-lg font-semibold tracking-tight text-navy"
        }
      >
        {target ? TARGET_COPY.activityTitle : "Atividade recente"}
      </h2>
      {!rail && (
        <p className="mt-1 text-[13px] text-muted">
          {target
            ? TARGET_COPY.activityLead
            : "Decisões, arquivos e fatos com data. Sem inventar o que não está no corte."}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-2 text-[13px] leading-snug text-muted">
          {target
            ? TARGET_COPY.activityEmpty
            : "Nada novo. Decisões registradas e arquivos classificados aparecem aqui."}
        </p>
      ) : (
        <ol className={rail ? "mt-3 space-y-2.5" : "mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2"}>
          {rows.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="group block">
                {/* who e dealName costumam ser a mesma operação: não repetir. */}
                <span className="block text-[12px] text-muted">
                  {[formatDate(item.at), item.who, item.dealName]
                    .filter((part, i, all) => part && all.indexOf(part) === i)
                    .join(" · ")}
                </span>
                <span className="block text-[13px] leading-snug text-navy group-hover:text-brand">
                  <span className="text-muted">{activityKindLabel(item.kind)} · </span>
                  <WithTerms text={item.title} interactive={false} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
