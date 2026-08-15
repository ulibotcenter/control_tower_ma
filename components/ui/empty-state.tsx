export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="paper px-4 py-8 text-center">
      <p className="font-medium text-navy">{title}</p>
      {hint ? <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}
