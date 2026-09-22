import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { DealView } from "@/components/deal/deal-view";
import { seedFromProposal } from "@/lib/ai/seed";
import { getDealBundle } from "@/lib/data/provider";
import { getPillarViews } from "@/lib/data/pillar-view";
import { getAiProposal } from "@/lib/data/store";
import { isDealAllowed } from "@/lib/meeting";
import { getMeeting } from "@/lib/mode";
import { getPresent } from "@/lib/present";
import { pillarOfDealPhase } from "@/lib/pillars";
import { isTemaSlug } from "@/lib/data/temas";

export default async function DealPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tema?: string; proposta?: string }>;
}) {
  const { slug } = await params;
  const { tema: raw, proposta } = await searchParams;
  const meeting = await getMeeting();
  // Reunião travada num alvo: o outro deal não abre nem por URL direta.
  if (!isDealAllowed(meeting, slug)) redirect(`/deals/${meeting.targetDeal}`);
  const present = await getPresent();
  const bundle = await getDealBundle(slug, meeting.mode);
  if (!bundle) notFound();
  const pillars = getPillarViews(bundle);
  const proposal =
    meeting.mode === "operate" && !present && proposta ? await getAiProposal(proposta).catch(() => null) : null;
  const seed = proposal && proposal.dealSlug === slug ? seedFromProposal(proposal) : null;

  return (
    <AppShell
      nav={{
        slug: bundle.deal.slug,
        name: bundle.deal.name,
        phasePillar: pillarOfDealPhase(bundle.deal.phase),
        pillars: pillars.map((p) => ({
          slug: p.slug,
          order: p.order,
          short: p.short,
          health: p.health,
        })),
      }}
    >
      <DealView
        bundle={bundle}
        pillars={pillars}
        mode={meeting.mode}
        present={present}
        tema={isTemaSlug(raw) ? raw : null}
        seed={seed}
      />
    </AppShell>
  );
}
