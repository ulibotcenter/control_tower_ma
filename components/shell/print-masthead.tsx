import { CORTE, PROGRAM_NAME, PROGRAM_SPONSOR } from "@/lib/constants";
import { MODE_META } from "@/lib/mode-meta";
import type { MeetingMode } from "@/lib/types";

export function PrintMasthead({
  mode,
  present,
  generatedAt,
  dealName = null,
}: {
  mode: MeetingMode;
  present: boolean;
  generatedAt: string;
  dealName?: string | null;
}) {
  const meta = MODE_META[mode];

  // O PDF gerado no modo Alvo pode acabar na mão do alvo. Ele não carrega o
  // nome do programa, o corte, o modo nem o público — só a operação e a data.
  if (mode === "target") {
    return (
      <div className="print-masthead mb-6 hidden border-b border-line pb-4">
        <div className="brand-bar is-single mb-3 w-28" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2410c]">
          Eleva Projects
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-navy">
          {dealName ?? "Situação formal"}
        </p>
        <p className="mt-1 text-sm text-[#3a4658]">Situação formal · gerado em {generatedAt}</p>
      </div>
    );
  }

  return (
    <div className="print-masthead mb-6 hidden border-b border-line pb-4">
      <div className="brand-bar mb-3 w-28" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c2410c]">
        Eleva Projects · Control Tower
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-navy">
        {PROGRAM_NAME} · {PROGRAM_SPONSOR}
      </p>
      <p className="mt-1 text-sm text-[#3a4658]">
        Corte {CORTE}
        {present ? " · Visão de apresentação" : ""}
        {" · "}
        {meta.label}
        {" · "}
        {meta.audience}
      </p>
      <p className="mt-0.5 text-[12px] text-[#3a4658]">
        Gerado em {generatedAt} · documento para reunião ou e-mail · sem controles de edição
      </p>
    </div>
  );
}
