import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { listDecisions } from "@/lib/data/store";
import { getMode } from "@/lib/mode";
import { canSeeDecisions } from "@/lib/visibility";
import { deals } from "@/lib/data/seed";
import { redirect } from "next/navigation";
import { getPresent } from "@/lib/present";
import { Freshness } from "@/components/ui/freshness";
import { DecisionHistory } from "@/components/decisions/decision-history";
import { focusSlugFromQuery } from "@/components/shell/focus-deal";

export default async function DecisionsPage({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string }>;
}) {
  const { deal } = await searchParams;
  const focus = focusSlugFromQuery(deal);
  const mode = await getMode();
  const present = await getPresent();
  const access = canSeeDecisions(mode);
  if (access === "hidden") redirect("/");

  const rows = await listDecisions();
  const summary = access === "summary" || present;
  const dealNames = Object.fromEntries(deals.map((d) => [d.id, d.name]));

  return (
    <AppShell focusSlug={focus}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Histórico</p>
          <h1 className="serif text-4xl text-navy">Decisões</h1>
          <Freshness />
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed">
            {summary
              ? "O que foi decidido, por quem, quando, e o impacto. A ficha completa da Eleva fica no modo Operar."
              : "Quem decidiu, o que a Eleva recomendou, o que foi decidido, o impacto, e se foi contra a recomendação."}
          </p>
        </div>
        {access === "full" && !present && (
          <Link href={focus ? `/decisions/nova?deal=${focus}` : "/decisions/nova"} className="btn no-print">
            Registrar decisão
          </Link>
        )}
      </div>

      <div className="mt-8">
        <DecisionHistory rows={rows} summary={summary} dealNames={dealNames} />
      </div>
    </AppShell>
  );
}
