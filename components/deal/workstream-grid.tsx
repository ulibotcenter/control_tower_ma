import Link from "next/link";
import { SemaphoreBadge } from "@/components/ui/semaphore";
import { Term } from "@/components/ui/term";
import { WithTerms } from "@/components/ui/with-terms";
import type { DealBundle, MeetingMode } from "@/lib/types";

export function WorkstreamGrid({
  bundle,
  mode,
}: {
  bundle: DealBundle;
  mode: MeetingMode;
}) {
  return (
    <section id="workstreams">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="kicker">Frentes</p>
          <h2 className="serif text-2xl text-navy">
            <Term id="workstream">Workstreams</Term>
          </h2>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {bundle.workstreams.map((ws) => (
          <Link
            key={ws.id}
            href={`/deals/${bundle.deal.slug}/${ws.slug}`}
            className="paper block p-4 hover:border-gold"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-navy">{ws.name}</h3>
              <SemaphoreBadge tone={ws.health} />
            </div>
            <p className="mt-1 text-[12px] text-muted">Dono · {ws.owner}</p>
            <p className="mt-2 text-sm leading-relaxed">
              <WithTerms text={mode === "target" ? ws.summaryTarget : ws.summary} interactive={false} />
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
