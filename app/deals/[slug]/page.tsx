import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { DealView } from "@/components/deal/deal-view";
import { getDealBundle } from "@/lib/data/provider";
import { getPillarViews } from "@/lib/data/pillar-view";
import { isDealAllowed } from "@/lib/meeting";
import { getMeeting } from "@/lib/mode";
import { getPresent } from "@/lib/present";
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
  const meeting = await getMeeting();
  // Reunião travada num alvo: o outro deal não abre nem por URL direta.
  if (!isDealAllowed(meeting, slug)) redirect(`/deals/${meeting.targetDeal}`);
  const present = await getPresent();
  const bundle = await getDealBundle(slug, meeting.mode);
  if (!bundle) notFound();

  return (
    <AppShell>
      <DealView
        bundle={bundle}
        pillars={getPillarViews(bundle)}
        mode={meeting.mode}
        present={present}
        tema={isTemaSlug(raw) ? raw : null}
      />
    </AppShell>
  );
}
