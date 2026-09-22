import { AppShell } from "@/components/shell/app-shell";
import { PillarAxis } from "@/components/deal/pillar-axis";
import { loadDealFrame } from "@/lib/deal-frame";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const frame = await loadDealFrame(slug);

  return (
    <AppShell nav={frame.nav}>
      <header>
        <p className="kicker">{frame.bundle.deal.name}</p>
        <h1 className="deal-name">Timeline</h1>
        <p className="timeline-method">O método Eleva neste mandato</p>
      </header>
      <PillarAxis
        dealSlug={frame.bundle.deal.slug}
        pillars={frame.pillars}
        mode={frame.mode}
        currentSlug={frame.nav.phasePillar}
      />
    </AppShell>
  );
}
