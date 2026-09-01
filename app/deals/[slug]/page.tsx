import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { DealView } from "@/components/deal/deal-view";
import { getDealBundle, getDealOptions } from "@/lib/data/provider";
import { isDealAllowed, lockedDeal } from "@/lib/meeting";
import { getMeeting } from "@/lib/mode";
import { getPresent } from "@/lib/present";

export default async function DealPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
        mode={meeting.mode}
        deals={getDealOptions()}
        onlyDeal={lockedDeal(meeting)}
        present={present}
      />
    </AppShell>
  );
}
