import Link from "next/link";

export function DealSwitcher({ current }: { current: string }) {
  const items = [
    { slug: "loopert", label: "Loopert", hint: "Prioridade", key: "1" },
    { slug: "radio-health", label: "Radio Health", hint: "Em análise", key: "2" },
  ];
  return (
    <div className="mb-5 flex w-full rounded-sm border border-line p-0.5 sm:inline-flex sm:w-auto" role="tablist" aria-label="Escolher operação">
      {items.map((item) => {
        const active = current === item.slug;
        return (
          <Link
            key={item.slug}
            href={`/deals/${item.slug}`}
            role="tab"
            aria-selected={active}
            title={`${item.label} · atalho ${item.key}`}
            className={`flex min-h-11 flex-1 items-center justify-center px-3 text-center text-sm sm:min-h-0 sm:flex-none sm:py-1.5 ${
              active
                ? item.slug === "loopert"
                  ? "bg-gold text-navy font-semibold"
                  : "bg-cyan text-navy font-semibold"
                : "text-muted hover:text-navy"
            }`}
          >
            {item.label}
            <span className="ml-1.5 hidden text-[11px] opacity-70 sm:inline">{item.hint}</span>
            <kbd className="kbd ml-1.5 hidden opacity-70 lg:inline">{item.key}</kbd>
          </Link>
        );
      })}
    </div>
  );
}
