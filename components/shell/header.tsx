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
            <PresentSwitch on={present} />
            <ModeSwitch meeting={meeting} deals={deals} />
          </div>
        </div>
      </div>
    </header>
  );
}
