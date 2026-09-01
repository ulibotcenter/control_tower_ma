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

/**
 * Uma barra só, 56px, tinta #0F172A, filete do logotipo no topo.
 *
 *   esquerda  marca e — fora do Alvo — o nome do programa em corpo miúdo
 *   centro    as operações como instrumento; travado no Alvo, vira o nome
 *             da operação e a fase, sem nada para clicar
 *   direita   modo, apresentação e saída
 *
 * A navegação de gestão (bandeja, decisões, pack, glossário) é uma faixa
 * fina abaixo, e existe só quando a Eleva está operando.
 */
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
  const projecting = mode === "target" && present;
  const showWorkNav = mode !== "target" && !present;

  return (
    <header
      className="no-print sticky top-0 z-40 bg-navy text-cream"
      style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
    >
      <div className="brand-bar" aria-hidden />

      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Eleva Projects">
          <Image
            src="/eleva-logo.png"
            alt="Eleva Projects"
            width={200}
            height={48}
            priority
            className="h-6 w-auto sm:h-7"
          />
          {/* Nome do produto e do programa são vocabulário nosso: fora do Alvo. */}
          {mode !== "target" && (
            <>
              <span className="hidden h-6 w-px bg-white/15 md:block" aria-hidden />
              <span className="hidden min-w-0 truncate text-[12px] text-cream/60 md:block">
                {PROGRAM_NAME} · {PROGRAM_SPONSOR}
                <span className="hidden lg:inline"> · corte {CORTE}</span>
              </span>
            </>
          )}
        </Link>

        {locked ? (
          <span className="flex min-w-0 basis-full flex-wrap items-baseline gap-x-3 sm:basis-auto sm:flex-1">
            <span className="truncate text-[16px] font-semibold tracking-tight text-cream sm:text-[17px]">
              {locked.name}
            </span>
            {locked.phaseLabel && (
              <span className="truncate text-[12px] text-cream/55 sm:text-[13px]">
                {locked.phaseLabel}
              </span>
            )}
          </span>
        ) : (
          <div className="flex min-w-0 basis-full justify-start sm:basis-auto sm:flex-1 md:justify-center">
            <DealPick deals={deals} onlyDeal={onlyDeal} />
          </div>
        )}

        <div className="flex flex-1 flex-wrap items-center justify-end gap-1.5 sm:flex-none">
          {mode === "target" && !present && (
            <span className="mode-chip">
              <span className="mode-chip-dot" aria-hidden />
              Visão formal{locked ? ` · ${locked.name}` : ""}
            </span>
          )}
          {!projecting && (
            <>
              <Shortcuts present={present} mode={mode} allowTour={mode !== "target"} />
              {/* Exportar carimba nome de programa e corte no PDF e no título
                  da aba. Não fica ao alcance de um clique com o alvo na sala. */}
              {mode !== "target" && <ExportPdfButton present={present} />}
            </>
          )}
          <PresentSwitch on={present} quiet={mode === "target"} />
          <ModeSwitch meeting={meeting} deals={deals} quiet={mode === "target"} />
          {!projecting && (
            <>
              <span className="hidden max-w-[9rem] truncate text-[12px] text-cream/60 xl:inline">
                {user.name}
              </span>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="hdr-btn" title="Encerrar a sessão">
                  Sair
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {showWorkNav && (
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4">
            <NavLinks mode={mode} inboxCount={inboxCount} present={present} />
          </div>
        </div>
      )}
    </header>
  );
}
