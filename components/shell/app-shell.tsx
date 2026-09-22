import { cookies } from "next/headers";
import { getSessionPayload } from "@/lib/auth";
import { lockedDeal } from "@/lib/meeting";
import { getPresent } from "@/lib/present";
import { unclassifiedCount, getDriveSyncedAt } from "@/lib/data/store";
import { getDealBundle, getDealOptions } from "@/lib/data/provider";
import { getPillarViews } from "@/lib/data/pillar-view";
import { pillarOfDealPhase } from "@/lib/pillars";
import { canSeeInbox } from "@/lib/visibility";
import type { MeetingMode } from "@/lib/types";
import { isOnboardedCookie, ONBOARD_COOKIE } from "@/lib/onboarding";
import { redirect } from "next/navigation";
import { Header } from "./header";
import { ModeBanner } from "./mode-banner";
import { WorkNav } from "./nav-links";
import { PrintMasthead } from "./print-masthead";
import { Onboarding } from "./onboarding";
import { SessionGuard } from "./session-guard";
import { DriveReviewHost } from "./drive-review";
import { SidebarProvider, SideNav } from "./sidebar";
import type { ShellDealNav } from "./shell-nav";

async function shellNavFor(slug: string, mode: MeetingMode): Promise<ShellDealNav | null> {
  const bundle = await getDealBundle(slug, mode);
  if (!bundle) return null;
  const pillars = getPillarViews(bundle);
  return {
    slug: bundle.deal.slug,
    name: bundle.deal.name,
    phasePillar: pillarOfDealPhase(bundle.deal.phase),
    pillars: pillars.map((p) => ({
      slug: p.slug,
      order: p.order,
      short: p.short,
      health: p.health,
    })),
  };
}

export async function AppShell({
  children,
  nav = null,
  focusSlug = null,
}: {
  children: React.ReactNode;
  nav?: ShellDealNav | null;
  /** `?deal=` nas rotas fora de `/deals`. Ignorado se o Alvo travou outro deal. */
  focusSlug?: string | null;
}) {
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
  const driveSyncedAt =
    !present && canSeeInbox(mode) ? await getDriveSyncedAt().catch(() => null) : null;
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
  const showWork = canSeeInbox(mode) && !present;
  // No Alvo a sidebar só existe para o deal travado. O outro nem é buscado.
  let dealNav = nav && (!onlyDeal || nav.slug === onlyDeal) ? nav : null;
  const focused = focusSlug && (!onlyDeal || focusSlug === onlyDeal) ? focusSlug : null;
  if (!dealNav && focused && dealOptions.some((d) => d.slug === focused)) {
    dealNav = await shellNavFor(focused, mode);
  }

  return (
    <SidebarProvider>
      <div
        className={`shell min-h-screen text-ink ${present ? "is-present-shell" : "bg-cream"}`}
        data-mode={mode}
        data-present={present ? "1" : "0"}
        data-work={showWork ? "1" : "0"}
      >
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-navy focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-cream"
        >
          Ir para o conteúdo
        </a>
        <SessionGuard />
        {mode === "operate" && !present && <DriveReviewHost />}
        <div className="shell-top">
          <Header
            user={user}
            meeting={meeting}
            deals={dealOptions}
            present={present}
            showToggle={!present}
            toggleLabel={dealNav ? "Abrir pilares" : "Abrir navegação"}
          />
          {showWork && <WorkNav mode={mode} inboxCount={inboxCount} driveSyncedAt={driveSyncedAt} />}
        </div>
        {mode !== "target" && <Onboarding openOnMount={showTour} />}
        {/*
         * Uma faixa só abaixo do cabeçalho, e só quando ela informa algo que o
         * cromo já não diz. Em Operar o próprio seletor mostra o modo, então o
         * aviso fica para Assessores, onde importa quem está na sala. No Alvo é
         * o chip discreto do cabeçalho. A legenda do semáforo desceu para o
         * rodapé do trilho da home, ao lado dos pontos que ela explica.
         */}
        {!present && mode === "advisors" && <ModeBanner meeting={meeting} />}
        <div className="shell-body">
          {!present && (
            <SideNav
              deal={dealNav}
              mode={mode}
              deals={dealOptions}
              inboxCount={inboxCount}
            />
          )}
          <main
            id="conteudo"
            className="shell-main px-4 py-6"
            style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto w-full max-w-6xl">
              <PrintMasthead
                mode={mode}
                present={present}
                generatedAt={generatedAt}
                dealName={dealOptions.find((d) => d.slug === onlyDeal)?.name ?? null}
              />
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
