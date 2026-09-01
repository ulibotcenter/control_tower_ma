import { MODE_META } from "@/lib/mode-meta";
import type { MeetingState } from "@/lib/meeting";

/**
 * Aviso de modo para a Eleva. Não existe versão para o modo Alvo: uma faixa
 * vermelha anunciando o que está sendo escondido é justamente o vazamento de
 * encenação que ela deveria evitar. No modo Alvo o sinal é o chip discreto do
 * cabeçalho, e ele some quando a apresentação liga.
 */
export function ModeBanner({ meeting }: { meeting: MeetingState }) {
  const meta = MODE_META[meeting.mode];

  if (meeting.mode === "operate") {
    return (
      <div className="no-print border-b border-navy-3 bg-navy-2 px-4 py-1.5 text-center text-[12px] text-cream/90 sm:text-[13px]">
        <strong className="text-brand-2">Modo Operar.</strong> {meta.shareLine}
      </div>
    );
  }

  if (meeting.mode === "advisors") {
    return (
      <div className="no-print bg-navy-2 px-4 py-2 text-center text-[13px] text-cream sm:text-sm">
        <strong className="text-brand-2">Modo Assessores.</strong> {meta.shareLine} {meta.audience}{" "}
        podem ver o que está na tela.
      </div>
    );
  }

  return null;
}
