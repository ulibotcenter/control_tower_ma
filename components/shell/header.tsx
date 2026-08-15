import Image from "next/image";
import Link from "next/link";
import { CORTE, PROGRAM_NAME, PROGRAM_SPONSOR } from "@/lib/constants";
import type { MeetingMode, SessionUser } from "@/lib/types";
import { ExportPdfButton } from "@/components/export/export-pdf-button";
import { ModeSwitch } from "./mode-switch";
import { NavLinks } from "./nav-links";
import { PresentSwitch } from "./present-switch";
import { Shortcuts } from "./shortcuts";

export function Header({
  user,
  mode,
  inboxCount,
  present = false,
}: {
  user: SessionUser;
  mode: MeetingMode;
  inboxCount: number;
  present?: boolean;
}) {
  return (
    <header className="no-print bg-navy text-cream" style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}>
      <div className="brand-bar" aria-hidden />
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-2 md:gap-3 md:px-4 md:py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <Image
              src="/eleva-logo.png"
              alt="Eleva Projects"
              width={200}
              height={48}
              priority
              className="h-6 w-auto sm:h-9"
            />
            <span className="hidden h-8 w-px bg-white/25 md:block" aria-hidden />
            <span className="min-w-0">
              <p className="kicker hidden !text-cyan sm:block">Control Tower</p>
              <p className="truncate text-[13px] font-semibold leading-tight tracking-tight text-cream sm:text-[15px]">
                {PROGRAM_NAME}{" "}
                <span className="text-gold">· {PROGRAM_SPONSOR}</span>
              </p>
              <p className="hidden text-[11px] tracking-wide text-cream/75 sm:block">corte {CORTE}</p>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 text-[12px] text-cream/80">
            <span className="hidden max-w-[10rem] truncate sm:inline">{user.name}</span>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="min-h-11 px-2 hover:text-gold sm:min-h-0"
                title="Encerrar a sessão"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Shortcuts present={present} allowTour={mode !== "target"} />
          <ExportPdfButton present={present} />
          <PresentSwitch on={present} />
          <ModeSwitch mode={mode} />
        </div>
        <NavLinks mode={mode} inboxCount={inboxCount} present={present} />
      </div>
    </header>
  );
}
