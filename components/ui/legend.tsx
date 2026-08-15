const ITEMS = [
  {
    tone: "green" as const,
    label: "No prazo",
    detail: "Nada impede o avanço nesta frente.",
  },
  {
    tone: "amber" as const,
    label: "Atenção",
    detail: "Precisa de acompanhamento. Ainda não trava o fechamento sozinho.",
  },
  {
    tone: "red" as const,
    label: "Bloqueia o deal",
    detail: "Tem que resolver isto antes de assinar ou mudar de fase.",
  },
  {
    tone: "gray" as const,
    label: "Ainda não começou",
    detail: "Esta etapa ainda não foi aberta.",
  },
];

export function SemaphoreLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted ${compact ? "" : "border-t border-line pt-3"}`}
      role="group"
      aria-label="Legenda do semáforo"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c2410c]">
        Semáforo
      </span>
      {ITEMS.map((item) => (
        <span key={item.tone} className="hint-wrap relative inline-flex items-center gap-1.5" tabIndex={0}>
          <span className={`dot dot-${item.tone}`} aria-hidden />
          <span>{item.label}</span>
          <span className="sr-only">. {item.detail}</span>
          <span role="tooltip" className="hint-tip">
            {item.detail}
          </span>
        </span>
      ))}
    </div>
  );
}
