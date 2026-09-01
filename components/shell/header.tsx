import Image from "next/image";
import Link from "next/link";
import { CORTE, PROGRAM_NAME, PROGRAM_SPONSOR } from "@/lib/constants";
import { lockedDeal, type MeetingState } from "@/lib/meeting";
import type { SessionUser } from "@/lib/types";
import { ExportPdfButton } from "@/components/export/export-pdf-button";
import { ModeSwitch, type DealOption } from "./mode-switch";
import { DealPick, NavLinks } from "./nav-links";
import { PresentSwitch } from "./present-switch";
import { Shortcuts } from "./shortcuts";

export function Header({
  user,
  meeting,
  deals,
  inboxCount,
  present = false,
}: {
  user: SessionUser;
  meeting: MeetingState;
  deals: DealOption[];
  inboxCount: number;
  present?: boolean;
}) {
  const mode = meeting.mode;
  const onlyDeal = lockedDeal(meeting);
  const locked = onlyDeal ? (deals.find((d) => d.slug === onlyDeal) ?? null) : null;

  // Alvo com a tela projetada: o cabeçalho de operação inteiro sai de cena.
  // Nome do produto, nome do programa, corte, bandeja, atalhos e exportação
  // são vocabulário interno — nada disso pertence a uma sala de reunião.
  if (mode === "target" && present) {
    return <MeetingMasthead deal={locked} meeting={meeting} deals={deals} />;
  }

  return (
    <header
      className="no-print sticky top-0 z-40 bg-navy text-cream"
      style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
    >
      <div className="brand-bar" aria-hidden />
      <div className="mx-auto max-w-6xl px-3 py-2.5 md:px-4 md:py-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/eleva-logo.png"
              alt="Eleva Projects"
              width={200}
              height={48}
              priority
              className="h-7 w-auto sm:h-8"
            />
            <span className="hidden h-7 w-px bg-white/20 md:block" aria-hidden />
            <span className="min-w-0 leading-tight">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan">
                Control Tower
              </span>
              <span className="block truncate text-[14px] font-semibold tracking-tight text-cream sm:text-[15px]">
                {PROGRAM_NAME}
                <span className="text-gold"> · {PROGRAM_SPONSOR}</span>
                <span className="ml-2 hidden font-normal text-cream/55 sm:inline">corte {CORTE}</span>
              </span>
            </span>
          </Link>

          <DealPick deals={deals} onlyDeal={onlyDeal} />

          <div className="flex shrink-0 items-center gap-2">
            {mode === "target" && (
              <span className="mode-chip">
                <span className="mode-chip-dot" aria-hidden />
                Visão formal{locked ? ` · ${locked.name}` : ""}
              </span>
            )}
            <span className="hidden max-w-[10rem] truncate text-[12px] text-cream/75 lg:inline">{user.name}</span>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="hdr-btn" title="Encerrar a sessão">
                Sair
              </button>
            </form>
          </div>
        </div>

        <div className="mt-2.5 flex flex-col gap-2 border-t border-white/10 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <NavLinks mode={mode} inboxCount={inboxCount} present={present} />
          <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
            <Shortcuts present={present} mode={mode} allowTour={mode !== "target"} />
            <ExportPdfButton present={present} />
            <PresentSwitch on={present} quiet={mode === "target"} />
            <ModeSwitch meeting={meeting} deals={deals} quiet={mode === "target"} />
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Cabeçalho de sala de reunião: logo da Eleva, nome da operação e a fase em
 * que ela está. Só isso. Os controles de modo continuam à direita, discretos,
 * porque a Eleva precisa conseguir sair quando o alvo deixar a sala.
 */
function MeetingMasthead({
  deal,
  meeting,
  deals,
}: {
  deal: DealOption | null;
  meeting: MeetingState;
  deals: DealOption[];
}) {
  return (
    <header
      className="no-print sticky top-0 z-40 bg-navy text-cream"
      style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
    >
      <div className="brand-bar is-single" aria-hidden />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:py-4">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Image
            src="/eleva-logo.png"
            alt="Eleva Projects"
            width={200}
            height={48}
            priority
            className="h-7 w-auto sm:h-8"
          />
          {deal && (
            <>
              <span className="h-8 w-px shrink-0 bg-white/20" aria-hidden />
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[17px] font-semibold tracking-tight text-cream sm:text-[19px]">
                  {deal.name}
                </span>
                {deal.phaseLabel && (
                  <span className="mt-0.5 block truncate text-[12px] text-cream/60 sm:text-[13px]">
                    {deal.phaseLabel}
                  </span>
                )}
              </span>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <PresentSwitch on quiet />
          <ModeSwitch meeting={meeting} deals={deals} quiet />
        </div>
      </div>
    </header>
  );
}
