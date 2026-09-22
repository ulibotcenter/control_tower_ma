import { AppShell } from "@/components/shell/app-shell";
import { DealView } from "@/components/deal/deal-view";
import { loadDealFrame } from "@/lib/deal-frame";
import { isTemaSlug } from "@/lib/data/temas";

export default async function DealPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tema?: string }>;
}) {
  const { slug } = await params;
  const { tema: raw } = await searchParams;
  const frame = await loadDealFrame(slug);

  return (
    <AppShell nav={frame.nav}>
      <DealView
        bundle={frame.bundle}
        pillars={frame.pillars}
        mode={frame.mode}
        present={frame.present}
        tema={isTemaSlug(raw) ? raw : null}
      />
    </AppShell>
  );
}
