import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { listDecisions } from "@/lib/data/store";
import { getMode } from "@/lib/mode";
import { canSeeDecisions } from "@/lib/visibility";
import { formatDate } from "@/lib/format";
import { deals } from "@/lib/data/seed";
import { redirect } from "next/navigation";

export default async function DecisionsPage() {
  const mode = await getMode();
  const access = canSeeDecisions(mode);
  if (access === "hidden") redirect("/");

  const rows = await listDecisions();
  const summary = access === "summary";

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Objeto de primeira classe</p>
          <h1 className="serif text-4xl text-navy">Registro de decisão</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed">
            {summary
              ? "Resumo para a sala com assessores. A ficha completa e as notas de proteção ficam no modo Operar."
              : "Quem decidiu, o que a Eleva recomendou, o que foi decidido, e se foi contra a recomendação. Isso protege a Eleva."}
          </p>
        </div>
        {access === "full" && (
          <Link href="/decisions/nova" className="btn">
            Registrar decisão
          </Link>
        )}
      </div>

      {rows.length === 0 && (
        <p className="mt-8 text-sm text-muted">Nenhuma decisão registrada neste corte.</p>
      )}

      <ul className="mt-8 space-y-4">
        {rows.map((d) => {
          const deal = deals.find((x) => x.id === d.dealId);
          return (
            <li key={d.id} className="paper p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="kicker">
                  {d.whoLabel} · {formatDate(d.date)} · {deal?.name ?? "Programa"}
                </p>
                {d.againstRecommendation && (
                  <span className="stamp text-alert">Contra a recomendação da Eleva</span>
                )}
              </div>
              <p className="mt-3 text-[16px] leading-relaxed">{d.decisionTaken}</p>
              {!summary && (
                <>
                  <p className="mt-3 text-sm">
                    <span className="text-muted">Recomendação Eleva · </span>
                    {d.elevaRecommendation}
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="text-muted">Consequência · </span>
                    {d.consequence}
                  </p>
                </>
              )}
              {summary && (
                <p className="mt-2 text-sm text-muted">Consequência · {d.consequence}</p>
              )}
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
