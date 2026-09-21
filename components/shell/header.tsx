import Image from "next/image";
import Link from "next/link";
import { lockedDeal, type MeetingState } from "@/lib/meeting";
import type { SessionUser } from "@/lib/types";
import { ExportPdfButton } from "@/components/export/export-pdf-button";
import { ModeSwitch, type DealOption } from "./mode-switch";
import { DealPick } from "./nav-links";
import { PresentSwitch } from "./present-switch";
import { SidebarToggle } from "./sidebar";
import { Shortcuts } from "./shortcuts";

/**
 * Barra de 56px + filete de 3px. No telefone vira duas linhas legíveis
 * (marca e deal; modo e apresentação), sem quebrar em três.
 *
 *   logo | deal atual | modo + apresentar | usuário + sair
 *
 * A faixa de trabalho (bandeja, decisões, pack, Drive) fica fora daqui.
 */
export function Header({
  user,
  meeting,
  deals,
  present = false,
  showToggle = false,
  toggleLabel = "Menu",
}: {
  user: SessionUser;
  meeting: MeetingState;
  deals: DealOption[];
  present?: boolean;
  showToggle?: boolean;
  toggleLabel?: string;
}) {
  const mode = meeting.mode;
  const onlyDeal = lockedDeal(meeting);
  const locked = onlyDeal ? (deals.find((d) => d.slug === onlyDeal) ?? null) : null;
  const projecting = mode === "target" && present;

  return (
    <header
      className="no-print bg-navy text-cream"
      style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
    >
      <div className="brand-bar" aria-hidden />

      <div className="hdr-bar">
        {showToggle && <SidebarToggle label={toggleLabel} />}

        <Link href="/" className="hdr-logo flex shrink-0 items-center" aria-label="Eleva Projects">
          <Image
            src="/eleva-logo.png"
            alt="Eleva Projects"
            width={200}
            height={48}
            priority
            className="h-6 w-auto"
          />
        </Link>

        <div className="hdr-deal">
          <DealPick deals={deals} onlyDeal={onlyDeal} />
        </div>

        <div className="hdr-tools">
          {mode === "target" && !present && (
            <span className="mode-chip hidden sm:inline-flex">
              <span className="mode-chip-dot" aria-hidden />
              Visão formal{locked ? ` · ${locked.name}` : ""}
            </span>
          )}
          {!projecting && (
            <>
              <Shortcuts present={present} mode={mode} allowTour={mode !== "target"} />
              {mode !== "target" && (
                <span className="hidden md:contents">
                  <ExportPdfButton present={present} />
                </span>
              )}
            </>
          )}
          <PresentSwitch on={present} quiet={mode === "target"} />
          <ModeSwitch meeting={meeting} deals={deals} quiet={mode === "target"} />
        </div>

        {!projecting && (
          <>
            <span className="hdr-user">{user.name}</span>
            <form action="/api/auth/logout" method="post" className="hdr-sair">
              <button type="submit" className="hdr-btn" title="Encerrar a sessão">
                {mode === "target" ? "Encerrar sessão" : "Sair"}
              </button>
            </form>
          </>
        )}
      </div>
    </header>
  );
}
