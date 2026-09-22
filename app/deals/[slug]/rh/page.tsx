import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { loadDealFrame } from "@/lib/deal-frame";
import { viewChrome } from "@/lib/mode-meta";

export default async function RhPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const frame = await loadDealFrame(slug);
  if (!viewChrome(frame.mode, frame.present).showRh) redirect(`/deals/${slug}`);

  return (
    <AppShell nav={frame.nav}>
      <header>
        <h1 className="serif text-4xl text-navy">RH</h1>
        <p className="mt-2 text-[15px] text-muted">Conteúdo no próximo bloco.</p>
      </header>
      <section className="paper mt-6 px-4 py-8" aria-label="Cap. Oficial">
        <h2 className="serif text-xl text-navy">Cap. Oficial</h2>
      </section>
      <section className="paper mt-4 px-4 py-8" aria-label="Pessoas">
        <h2 className="serif text-xl text-navy">Pessoas</h2>
      </section>
    </AppShell>
  );
}
