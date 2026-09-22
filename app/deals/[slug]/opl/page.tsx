import { AppShell } from "@/components/shell/app-shell";
import { NoteComposer } from "@/components/deal/note-composer";
import { MeetingTabs } from "@/components/deal/meeting-tabs";
import { PendingTable } from "@/components/deal/pending-table";
import { RoomProvider, RoomStrip } from "@/components/deal/room-bar";
import { NotesList } from "@/components/deal/lists";
import { seedFromProposal } from "@/lib/ai/seed";
import { loadDealFrame } from "@/lib/deal-frame";
import { getAiProposal } from "@/lib/data/store";

export default async function OpenPointsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ proposta?: string }>;
}) {
  const { slug } = await params;
  const { proposta } = await searchParams;
  const frame = await loadDealFrame(slug);
  const { bundle, mode, present } = frame;
  const canWrite = mode === "operate" && !present;
  const proposal =
    canWrite && proposta ? await getAiProposal(proposta).catch(() => null) : null;
  const seed = proposal && proposal.dealSlug === slug ? seedFromProposal(proposal) : null;

  return (
    <AppShell nav={frame.nav}>
      <RoomProvider dealSlug={bundle.deal.slug} seed={canWrite ? seed : null}>
        <section id="opl" className="war-block war-opl">
          <MeetingTabs
            tools={canWrite ? <RoomStrip /> : null}
            pendencias={
              <>
                <h2 className="war-label">Pontos em aberto</h2>
                <PendingTable points={bundle.openPoints} tasks={bundle.actions} canEdit={canWrite} />
              </>
            }
            anotacoes={
              bundle.notes.length > 0 || canWrite ? (
                <NotesList
                  items={bundle.notes}
                  compact
                  canEdit={canWrite}
                  compose={canWrite ? <NoteComposer dealSlug={bundle.deal.slug} /> : null}
                />
              ) : (
                <p className="ops-empty">Nenhuma anotação neste deal.</p>
              )
            }
          />
        </section>
      </RoomProvider>
    </AppShell>
  );
}
