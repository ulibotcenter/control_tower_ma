import type { MeetingMode } from "@/lib/types";

export function ModeBanner({ mode }: { mode: MeetingMode }) {
  if (mode === "operate") return null;

  if (mode === "advisors") {
    return (
      <div className="bg-navy-2 text-cream px-4 py-2 text-center text-[13px] sm:text-sm">
        <strong className="text-gold">Modo Reunião · Assessores.</strong> Bandeja crua, notas de
        proteção da Eleva e credenciais estão ocultas. O que está na tela pode ser visto por AD+R,
        Pacta e João Amorim.
      </div>
    );
  }

  return (
    <div className="bg-alert text-cream px-4 py-2.5 text-center text-[13px] sm:text-sm font-medium">
      <strong>MODO ALVO LIGADO.</strong> Só fase, documentos pedidos e pendências formais. Esta
      tela pode ser vista por quem está sendo avaliado.
    </div>
  );
}
