import { cookies } from "next/headers";
import { getSessionPayload } from "@/lib/auth";
import { lockedDeal } from "@/lib/meeting";
import { getPresent } from "@/lib/present";
import { unclassifiedCount } from "@/lib/data/store";
import { getDealOptions } from "@/lib/data/provider";
import { canSeeInbox } from "@/lib/visibility";
import { MODE_META } from "@/lib/mode-meta";
import { isOnboardedCookie, ONBOARD_COOKIE } from "@/lib/onboarding";
import { redirect } from "next/navigation";
import { Header } from "./header";
import { ModeBanner } from "./mode-banner";
import { PrintMasthead } from "./print-masthead";
import { Onboarding } from "./onboarding";
import { SessionGuard } from "./session-guard";
import { DriveReviewHost } from "./drive-review";

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
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-brand focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Ir para o conteúdo
      </a>
      <SessionGuard />
      {mode === "operate" && !present && <DriveReviewHost />}
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
          <strong className="text-brand-2">Modo apresentação · {MODE_META[mode].label}.</strong>{" "}
          Operação e edição estão ocultas. {MODE_META[mode].shareLine}
        </div>
      )}
      {/*
       * Uma faixa só abaixo do cabeçalho, e só quando ela informa algo que o
       * cromo já não diz. Em Operar o próprio seletor mostra o modo, então o
       * aviso fica para Assessores, onde importa quem está na sala. No Alvo é
       * o chip discreto do cabeçalho. A legenda do semáforo desceu para o
       * rodapé do trilho da home, ao lado dos pontos que ela explica.
       */}
      {!present && mode === "advisors" && <ModeBanner meeting={meeting} />}
      <main
        id="conteudo"
        className="mx-auto max-w-6xl px-4 py-6"
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
