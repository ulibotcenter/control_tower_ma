import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { DealSwitcher } from "@/components/deal/deal-switcher";
import { ChecklistTable } from "@/components/deal/checklist-table";
import { DocsList } from "@/components/deal/lists";
import { ActionBoard } from "@/components/deal/action-board";
import { RisksBoard } from "@/components/deal/risks-board";
import { SemaphoreBadge } from "@/components/ui/semaphore";
import { WithTerms } from "@/components/ui/with-terms";
import { getDealBundle, getDealOptions, workstreamOf } from "@/lib/data/provider";
import { isDealAllowed, lockedDeal } from "@/lib/meeting";
import { getMeeting } from "@/lib/mode";

export default async function WorkstreamPage({
  params,
}: {
  params: Promise<{ slug: string; workstream: string }>;
}) {
  const { slug, workstream } = await params;
  const meeting = await getMeeting();
  if (!isDealAllowed(meeting, slug)) redirect(`/deals/${meeting.targetDeal}`);
  const mode = meeting.mode;
  const bundle = await getDealBundle(slug, mode);
  if (!bundle) notFound();
  const ws = workstreamOf(bundle, workstream);
  if (!ws) notFound();

  const checks = bundle.checklist.filter((c) => c.workstreamSlug === ws.slug);
  const rs = bundle.risks.filter((r) => r.workstreamSlug === ws.slug);
  const ac = bundle.actions.filter((a) => a.workstreamSlug === ws.slug);
  const docs = bundle.documents.filter((d) => d.workstreamSlug === ws.slug);

  return (
    <AppShell>
      <div className="no-print">
        <DealSwitcher
          current={slug}
          deals={getDealOptions({ onlyDeal: lockedDeal(meeting) })}
          onlyDeal={lockedDeal(meeting)}
        />
      </div>
      <p className="no-print text-sm">
        <Link href={`/deals/${slug}`} className="text-muted hover:text-navy">
          ← {bundle.deal.name}
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">{bundle.deal.name}</p>
          <h1 className="serif text-4xl text-navy">{ws.name}</h1>
          <p className="mt-1 text-sm text-muted">Dono · {ws.owner}</p>
        </div>
        <SemaphoreBadge tone={ws.health} />
      </div>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed">
        <WithTerms text={mode === "target" ? ws.summaryTarget : ws.summary} />
      </p>

      <section className="mt-10">
        <h2 className="serif text-2xl text-navy">Checklist desta frente</h2>
        <p className="mb-3 mt-1 text-sm text-muted">
          {mode === "target"
            ? "Itens formais desta frente. Arquivo novo não conclui o item."
            : "Classificar um arquivo na bandeja não marca item como concluído."}
        </p>
        <ChecklistTable items={checks} />
      </section>

      <section className="mt-10">
        <h2 className="serif mb-3 text-2xl text-navy">Riscos</h2>
        <RisksBoard items={rs} />
      </section>

      <section className="mt-10">
        <h2 className="serif mb-3 text-2xl text-navy">Ações</h2>
        <ActionBoard items={ac} />
      </section>

      <section className="mt-10">
        <h2 className="serif mb-3 text-2xl text-navy">Documentos</h2>
        <DocsList items={docs} />
      </section>
    </AppShell>
  );
}
