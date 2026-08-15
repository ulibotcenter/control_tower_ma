export function LoadingBlock({
  label,
  bars = 2,
}: {
  label: string;
  bars?: number;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="skeleton h-3 w-28" />
      <div className="skeleton mt-3 h-8 w-56" />
      <div className={`mt-8 grid gap-4 ${bars > 2 ? "sm:grid-cols-2 lg:grid-cols-5" : "sm:grid-cols-2"}`}>
        {Array.from({ length: bars }).map((_, i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">{label}</p>
    </div>
  );
}
