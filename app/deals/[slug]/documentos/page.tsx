import { AppShell } from "@/components/shell/app-shell";
import { DocTree } from "@/components/deal/doc-tree";
import { loadDealFrame } from "@/lib/deal-frame";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const frame = await loadDealFrame(slug);
  const { bundle, mode } = frame;

  return (
    <AppShell nav={frame.nav}>
      <section id="documentos" className="war-block">
        <h2 className="war-label">Data room</h2>
        <div className="mt-3">
          <DocTree items={bundle.documents} roomId={bundle.deal.driveFolderId} mode={mode} />
        </div>
      </section>
    </AppShell>
  );
}
