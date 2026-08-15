import { MODE_META } from "@/lib/mode-meta";
import type { MeetingMode } from "@/lib/types";

export function ModeBanner({ mode }: { mode: MeetingMode }) {
  const meta = MODE_META[mode];

  if (mode === "operate") {
    return (
      <div className="no-print border-b border-navy-3 bg-navy-2 px-4 py-1.5 text-center text-[12px] text-cream/90 sm:text-[13px]">
        <strong className="text-gold">Modo Operar.</strong> {meta.shareLine}
      </div>
    );
  }

  if (mode === "advisors") {
    return (
      <div className="no-print bg-navy-2 px-4 py-2 text-center text-[13px] text-cream sm:text-sm">
        <strong className="text-cyan">Modo Assessores.</strong> {meta.shareLine} {meta.audience}{" "}
        podem ver o que está na tela.
      </div>
    );
  }

  return (
    <div className="no-print bg-alert px-4 py-2.5 text-center text-[13px] font-medium text-cream sm:text-sm">
      <strong>MODO ALVO LIGADO.</strong> {meta.shareLine} Esta tela pode ser vista por quem está
      sendo avaliado.
    </div>
  );
}
