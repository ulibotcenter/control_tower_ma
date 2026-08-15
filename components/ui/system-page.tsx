export function SystemPage({
  kicker = "Control Tower",
  title,
  hint,
  digest,
  actions,
}: {
  kicker?: string;
  title: string;
  hint: string;
  digest?: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream px-6 py-24 text-ink">
      <p className="kicker">{kicker}</p>
      <h1 className="serif mt-2 text-4xl text-navy">{title}</h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">{hint}</p>
      {digest ? <p className="mt-2 font-mono text-[12px] text-muted">ref {digest}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">{actions}</div>
    </div>
  );
}
