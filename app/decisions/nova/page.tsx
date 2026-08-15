import { AppShell } from "@/components/shell/app-shell";
import { DecisionForm } from "@/components/decisions/decision-form";
import { deals } from "@/lib/data/seed";
import { getMode } from "@/lib/mode";
import { canRegisterDecision } from "@/lib/visibility";
import { redirect } from "next/navigation";

export default async function NewDecisionPage() {
  const mode = await getMode();
  if (!canRegisterDecision(mode)) redirect("/decisions");

  return (
    <AppShell>
      <p className="kicker">Proteção da Eleva</p>
      <h1 className="serif text-4xl text-navy">Registrar decisão</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Se o board for contra a recomendação, marque. A nota de proteção só aparece no modo Operar.
      </p>
      <DecisionForm deals={deals.map((d) => ({ id: d.id, name: d.name }))} />
    </AppShell>
  );
}
