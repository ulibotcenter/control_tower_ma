import { AppShell } from "@/components/shell/app-shell";
import { IndicatorsBoard } from "@/components/deal/indicators-board";
import { loadDealFrame } from "@/lib/deal-frame";

export default async function IndicatorsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const frame = await loadDealFrame(slug);

  return (
    <AppShell nav={frame.nav}>
      <IndicatorsBoard bundle={frame.bundle} pillars={frame.pillars} mode={frame.mode} />
    </AppShell>
  );
}
