import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { ElevaRoom } from "@/components/deal/eleva-room";
import { loadDealFrame } from "@/lib/deal-frame";
import { viewChrome } from "@/lib/mode-meta";

export default async function InternalReadingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const frame = await loadDealFrame(slug);
  if (!viewChrome(frame.mode, frame.present).showInternalReading) redirect(`/deals/${slug}`);

  return (
    <AppShell nav={frame.nav}>
      <ElevaRoom bundle={frame.bundle} mode={frame.mode} present={frame.present} />
    </AppShell>
  );
}
