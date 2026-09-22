import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { loadDealFrame } from "@/lib/deal-frame";
import { RhCards } from "@/components/deal/rh-cards";
import { applyRhEdits, loopertDeckCards } from "@/lib/data/rh-deck";
import { findRhMeetingName, seedPersonCards } from "@/lib/data/rh-people";
import { listRhCardEdits } from "@/lib/data/store";
import { viewChrome } from "@/lib/mode-meta";

export default async function RhPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const frame = await loadDealFrame(slug);
  if (!viewChrome(frame.mode, frame.present).showRh) redirect(`/deals/${slug}`);

  const { bundle } = frame;
  const cap = bundle.capTable;
  const loopert = bundle.deal.slug === "loopert";
  const cards = loopert
    ? applyRhEdits(loopertDeckCards(), await listRhCardEdits())
    : seedPersonCards(bundle.people);
  const meeting = findRhMeetingName(bundle.documents.map((doc) => doc.title));

  return (
    <AppShell nav={frame.nav}>
      <header>
        <h1 className="serif text-4xl text-navy">RH</h1>
      </header>

      <section className="mt-6" aria-label="Cap. Oficial">
        <h2 className="serif text-xl text-navy">Cap. Oficial</h2>
        {cap.length > 0 ? (
          <div className="paper mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy text-cream text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-2 text-left font-medium">Nome</th>
                  <th className="px-4 py-2 text-right font-medium">Participação</th>
                  <th className="px-4 py-2 text-left font-medium">Função</th>
                </tr>
              </thead>
              <tbody>
                {cap.map((row) => (
                  <tr key={row.name} className="border-t border-line">
                    <td className="px-4 py-2">{row.name}</td>
                    <td className="px-4 py-2 text-right font-semibold">{row.pct}</td>
                    <td className="px-4 py-2 text-muted">{row.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="mt-8" aria-label="Pessoas">
        <h2 className="serif text-xl text-navy">Pessoas</h2>
        <RhCards cards={cards} canEdit={frame.mode === "operate"} />
        {cards.length > 0 || meeting ? null : <p className="mt-3 text-sm text-muted">Reunião de RH ainda sem texto indexado</p>}
      </section>
    </AppShell>
  );
}
