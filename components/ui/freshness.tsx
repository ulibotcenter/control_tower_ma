import { CORTE } from "@/lib/constants";
import type { MeetingMode } from "@/lib/types";

/**
 * `mode`: no Alvo fica só a data. O selo de confiança é controle de qualidade
 * do nosso dado — leitura interna, e mais um ponto colorido na tela do cliente.
 */
export function Freshness({
  trust = "firm",
  label,
  mode,
}: {
  trust?: "firm" | "review";
  label?: string;
  mode?: MeetingMode;
}) {
  if (mode === "target") {
    return (
      <p className="mt-1 text-[12px] text-muted">
        {label ?? `Atualizado em ${CORTE}`}
      </p>
    );
  }

  const detail =
    trust === "firm"
      ? "Número ou fato já formalizado."
      : "Leitura em revisão — não tratar como fechado.";
  const tag = trust === "firm" ? "Dados confiáveis" : "Dados em revisão";

  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
      <span>{label ?? `Atualizado em ${CORTE} às 18:00`}</span>
      <span
        className={`hint-wrap relative inline-flex items-center gap-1 ${
          trust === "firm" ? "text-go" : "text-wait"
        }`}
        tabIndex={0}
      >
        <span className={`dot ${trust === "firm" ? "dot-green" : "dot-amber"}`} aria-hidden />
        {tag}
        <span className="sr-only">. {detail}</span>
        <span role="tooltip" className="hint-tip">
          {detail}
        </span>
      </span>
    </p>
  );
}
