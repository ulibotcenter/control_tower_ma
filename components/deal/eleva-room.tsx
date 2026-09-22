import { Term } from "@/components/ui/term";
import { Freshness } from "@/components/ui/freshness";
import { WithTerms } from "@/components/ui/with-terms";
import { atasEleva } from "@/lib/data/atas-eleva";
import { viewChrome } from "@/lib/mode-meta";
import type { DealBundle, MeetingMode } from "@/lib/types";
import { AtasElevaList } from "./atas-eleva-list";
import { CapTable } from "./lists";
import { ThesisPrice } from "./thesis-price";

/**
 * O bloco que era “Sala Eleva” na war room. Só entra em Leitura Interna (Operar).
 * Tese, preço, cap e pessoas — o que já estava, no mesmo lugar.
 */
export function ElevaRoom({
  bundle,
  mode,
  present = false,
}: {
  bundle: DealBundle;
  mode: MeetingMode;
  present?: boolean;
}) {
  const chrome = viewChrome(mode, present);
  if (!chrome.showInternalReading) return null;

  const { deal } = bundle;
  const showThesis = (chrome.showThesis && bundle.thesis.length > 0) || (chrome.showThesis && bundle.prices.length > 0);
  const showCap = chrome.showCap && bundle.capTable.length > 0;
  const showPeople = chrome.showPeople && bundle.people.length > 0;
  const atas = atasEleva(bundle.documents, deal.driveFolderId);
  if (!showThesis && !showCap && !showPeople && atas.length === 0) return null;

  return (
    <section id="tese" className="eleva-room mb-4">
      <p className="eleva-room-label">Sala Eleva</p>
      <h2 className="serif mt-1 text-[22px] leading-tight text-navy">Leitura interna</h2>
      <p className="mt-1 max-w-2xl text-[13px] text-muted">
        Tese, preço, quadro societário e pessoas. Não é fato formal da operação e não vai para
        a tela de reunião.
      </p>

      {showThesis && (
        <div className="mt-8">
          <ThesisPrice thesis={bundle.thesis} prices={bundle.prices} hidden={false} />
        </div>
      )}

      <AtasElevaList items={bundle.documents} roomId={deal.driveFolderId} />

      {showCap && (
        <div className="mt-10">
          <h3 className="serif mb-1 text-xl text-navy">
            {deal.slug === "radio-health" ? (
              <>
                <Term id="cap">Cap</Term> verbal — a confirmar
              </>
            ) : (
              <>
                <Term id="cap">Cap</Term> oficial
              </>
            )}
          </h3>
          <Freshness trust={deal.slug === "radio-health" ? "review" : "firm"} mode={mode} />
          <div className="mt-3">
            <CapTable rows={bundle.capTable} />
          </div>
        </div>
      )}

      {showPeople && (
        <div className="mt-10">
          <h3 className="serif mb-3 text-xl text-navy">Pessoas</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {bundle.people.map((p) => (
              <li key={p.name} className="paper px-4 py-3 text-sm">
                <span className="font-semibold text-navy">{p.name}</span>
                <span className="text-muted"> · {p.role}</span>
                <p className="mt-1 text-muted">
                  <WithTerms text={p.note} />
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
