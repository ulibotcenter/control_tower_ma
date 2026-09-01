import Link from "next/link";

const HINTS: Record<string, { hint: string; key: string }> = {
  loopert: { hint: "Prioridade", key: "1" },
  "radio-health": { hint: "Em análise", key: "2" },
};

/**
 * `onlyDeal` vem do modo Alvo. Com a reunião travada num alvo o seletor some:
 * não há para onde trocar, e o nome da outra operação não vai para a tela.
 */
export function DealSwitcher({
  current,
  deals,
  onlyDeal = null,
}: {
  current: string;
  deals: { slug: string; name: string }[];
  onlyDeal?: string | null;
}) {
  if (onlyDeal) return null;

  return (
    <div className="mb-5 flex w-full rounded-sm border border-line p-0.5 sm:inline-flex sm:w-auto" role="tablist" aria-label="Escolher operação">
      {deals.map((item) => {
        const active = current === item.slug;
        const meta = HINTS[item.slug];
        return (
          <Link
            key={item.slug}
            href={`/deals/${item.slug}`}
            role="tab"
            aria-selected={active}
            title={meta ? `${item.name} · atalho ${meta.key}` : item.name}
            className={`flex min-h-11 flex-1 items-center justify-center px-3 text-center text-sm sm:min-h-0 sm:flex-none sm:py-1.5 ${
              active ? "bg-gold text-white font-semibold" : "text-muted hover:text-navy"
            }`}
          >
            {item.name}
            {meta && (
              <>
                <span className="ml-1.5 hidden text-[11px] opacity-70 sm:inline">{meta.hint}</span>
                <kbd className="kbd ml-1.5 hidden opacity-70 lg:inline">{meta.key}</kbd>
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
}
