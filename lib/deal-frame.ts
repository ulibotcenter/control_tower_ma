import { notFound, redirect } from "next/navigation";
import type { ShellDealNav } from "@/components/shell/shell-nav";
import { getDealBundle } from "@/lib/data/provider";
import { getPillarViews, type PillarView } from "@/lib/data/pillar-view";
import { isDealAllowed } from "@/lib/meeting";
import { getMeeting } from "@/lib/mode";
import { getPresent } from "@/lib/present";
import { pillarOfDealPhase } from "@/lib/pillars";
import type { DealBundle, MeetingMode } from "@/lib/types";

export type DealFrame = {
  mode: MeetingMode;
  present: boolean;
  bundle: DealBundle;
  pillars: PillarView[];
  nav: ShellDealNav;
};

/** Carga comum das casas do deal. O Alvo travado não abre o outro slug. */
export async function loadDealFrame(slug: string): Promise<DealFrame> {
  const meeting = await getMeeting();
  if (!isDealAllowed(meeting, slug)) redirect(`/deals/${meeting.targetDeal}`);
  const present = await getPresent();
  const bundle = await getDealBundle(slug, meeting.mode);
  if (!bundle) notFound();
  const pillars = getPillarViews(bundle);
  return {
    mode: meeting.mode,
    present,
    bundle,
    pillars,
    nav: {
      slug: bundle.deal.slug,
      name: bundle.deal.name,
      phasePillar: pillarOfDealPhase(bundle.deal.phase),
      pillars: pillars.map((p) => ({
        slug: p.slug,
        order: p.order,
        short: p.short,
        health: p.health,
      })),
    },
  };
}
