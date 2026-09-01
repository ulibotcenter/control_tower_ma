import { cookies } from "next/headers";
import { getSessionPayload } from "@/lib/auth";
import { lockedDeal } from "@/lib/meeting";
import { getPresent } from "@/lib/present";
import { unclassifiedCount } from "@/lib/data/store";
import { getAttentionItems, getDealOptions } from "@/lib/data/provider";
import { canSeeInbox } from "@/lib/visibility";
import { MODE_META } from "@/lib/mode-meta";
import { isOnboardedCookie, ONBOARD_COOKIE } from "@/lib/onboarding";
import { redirect } from "next/navigation";
import { Header } from "./header";
import { ModeBanner } from "./mode-banner";
import { AttentionStrip } from "./attention-strip";
import { PrintMasthead } from "./print-masthead";
import { Onboarding } from "./onboarding";
import { SessionGuard } from "./session-guard";
import { SemaphoreLegend } from "../ui/legend";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSessionPayload();
  if (!session) redirect("/login");
  const { user, meeting } = session;
  const mode = meeting.mode;
  const onlyDeal = lockedDeal(meeting);
  const present = await getPresent();
  let inboxCount = 0;
  if (!present && canSeeInbox(mode)) {
    try {
      inboxCount = await unclassifiedCount();
    } catch (err) {
      console.error("[shell] unclassifiedCount falhou", err);
    }
  }
  // O bloco Atenção é war-room: "riscos críticos", "ações atrasadas", tarja
  // vermelha. Não entra em sala com o alvo — e o modo Alvo está a um clique de
  // ser projetado, então sai do modo inteiro, não só da apresentação.
  const attention = mode === "target" ? [] : getAttentionItems(mode, { onlyDeal });
  // Recortado no servidor: o nome da outra operação não pode nem viajar no
  // payload da página que está sendo projetada para o alvo.
  const dealOptions = getDealOptions({ onlyDeal });
  const jar = await cookies();
  const showTour = !isOnboardedCookie(jar.get(ONBOARD_COOKIE)?.value) && mode !== "target" && !present;
  const generatedAt = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="min-h-screen bg-cream text-ink"
      data-mode={mode}
      data-present={present ? "1" : "0"}
    >
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-gold focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy"
      >
        Ir para o conteúdo
      </a>
      <SessionGuard />
      <Header
        user={user}
        meeting={meeting}
        deals={dealOptions}
        inboxCount={inboxCount}
        present={present}
      />
      {mode !== "target" && <Onboarding openOnMount={showTour} />}
      {present && mode !== "target" && (
        <div className="no-print bg-navy-2 px-4 py-2 text-center text-[13px] text-cream">
          <strong className="text-cyan">Modo apresentação · {MODE_META[mode].label}.</strong>{" "}
          Operação e edição estão ocultas. {MODE_META[mode].shareLine}
        </div>
      )}
      {/* No modo Alvo o aviso vira o chip discreto do header (ver Header). */}
      {!present && mode !== "target" && <ModeBanner meeting={meeting} />}
      <AttentionStrip items={attention} />
      {!present && (
        <div className="no-print hidden border-b border-line bg-paper sm:block">
          <div className="mx-auto max-w-6xl px-4 py-2">
            <SemaphoreLegend compact />
          </div>
        </div>
      )}
      <main
        id="conteudo"
        className="mx-auto max-w-6xl px-4 py-6 md:py-8"
        style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
      >
        <PrintMasthead
          mode={mode}
          present={present}
          generatedAt={generatedAt}
          dealName={dealOptions.find((d) => d.slug === onlyDeal)?.name ?? null}
        />
        {children}
      </main>
    </div>
  );
}
