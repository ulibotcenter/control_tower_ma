export function SemaphoreLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted ${compact ? "" : "border-t border-line pt-3"}`}
      role="note"
    >
      <span className="tracking-[0.14em] uppercase text-[11px] text-gold font-semibold">
        Semáforo
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="dot dot-green" /> No prazo
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="dot dot-amber" /> Atenção
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="dot dot-red" /> Bloqueia o deal
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="dot dot-gray" /> Ainda não começou
      </span>
    </div>
  );
}
