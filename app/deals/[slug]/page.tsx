import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { DealView } from "@/components/deal/deal-view";
import { getDealBundle } from "@/lib/data/provider";
import { getMode } from "@/lib/mode";

export default async function DealPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mode = await getMode();
  const bundle = await getDealBundle(slug, mode);
  if (!bundle) notFound();

  return (
    <AppShell>
      <DealView bundle={bundle} mode={mode} />
    </AppShell>
  );
}
