import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { loadDealFrame } from "@/lib/deal-frame";
import { DECK_SOURCE, loopertDeckCards } from "@/lib/data/rh-deck";
import { findRhMeetingName, seedPersonCards } from "@/lib/data/rh-people";
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
  const cards = bundle.deal.slug === "loopert" ? loopertDeckCards() : seedPersonCards(bundle.people);
  const fromDeck = cards.some((card) => card.source === DECK_SOURCE);
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
        {cards.length > 0 ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {cards.map((card) => (
              <li key={`${card.source}-${card.name}`} className="paper px-4 py-3 text-sm">
                <p className="font-semibold text-navy">{card.name}</p>
                <dl className="mt-2 space-y-1 text-[13px]">
                  <div className="flex gap-2">
                    <dt className="text-muted">Função</dt>
                    <dd>{card.role}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted">Anos de empresa</dt>
                    <dd>{card.years}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted">Importância (atual / PMI)</dt>
                    <dd>{card.importance}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted">Salário</dt>
                    <dd>{card.salary}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted">Fonte</dt>
                    <dd>{card.source}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        ) : null}
        {meeting || fromDeck ? null : <p className="mt-3 text-sm text-muted">Reunião de RH ainda sem texto indexado</p>}
      </section>
    </AppShell>
  );
}
