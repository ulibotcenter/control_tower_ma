import Link from "next/link";
import { CORTE, PROGRAM_NAME, PROGRAM_SPONSOR } from "@/lib/constants";
import type { MeetingMode, SessionUser } from "@/lib/types";
import { ModeSwitch } from "./mode-switch";
import { NavLinks } from "./nav-links";

export function Header({
  user,
  mode,
  inboxCount,
}: {
  user: SessionUser;
  mode: MeetingMode;
  inboxCount: number;
}) {
  return (
    <header className="bg-navy text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/" className="block">
            <p className="kicker">Control Tower</p>
            <p className="serif text-xl leading-none text-cream">
              {PROGRAM_NAME}{" "}
              <span className="text-gold">· {PROGRAM_SPONSOR}</span>
            </p>
            <p className="mt-1 text-[11px] tracking-wide text-cream/60">
              Eleva Projects · corte {CORTE}
            </p>
          </Link>
        </div>

        <NavLinks mode={mode} inboxCount={inboxCount} />

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <ModeSwitch mode={mode} />
          <div className="flex items-center justify-between gap-3 text-[12px] text-cream/60">
            <span>{user.name}</span>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="hover:text-gold">
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
