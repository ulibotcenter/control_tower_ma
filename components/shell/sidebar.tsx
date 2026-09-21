"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { semaphoreShortFor } from "@/lib/mode-meta";
import type { PillarSlug } from "@/lib/pillars";
import type { MeetingMode, Semaphore } from "@/lib/types";
import { canSeeDecisions, canSeeInbox } from "@/lib/visibility";
import type { ShellDealNav } from "./shell-nav";

type Ctx = { open: boolean; setOpen: (v: boolean) => void };

const SidebarCtx = createContext<Ctx | null>(null);

function useSidebar() {
  const ctx = useContext(SidebarCtx);
  if (!ctx) throw new Error("Sidebar fora do provider");
  return ctx;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    function onResize() {
      if (window.matchMedia("(min-width: 1024px)").matches) setOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    if (mobile) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return <SidebarCtx.Provider value={{ open, setOpen }}>{children}</SidebarCtx.Provider>;
}

export function SidebarToggle({ label }: { label: string }) {
  const { open, setOpen } = useSidebar();
  return (
    <button
      type="button"
      className="hdr-btn shell-toggle hdr-toggle lg:hidden"
      aria-expanded={open}
      aria-controls="shell-nav"
      aria-label={label}
      onClick={() => setOpen(true)}
    >
      <span className="shell-toggle-icon" aria-hidden />
    </button>
  );
}

function isOn(path: string, href: string) {
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}

export function SideNav({
  deal,
  mode,
  deals,
  inboxCount,
}: {
  deal: ShellDealNav | null;
  mode: MeetingMode;
  deals: { slug: string; name: string; health: Semaphore }[];
  inboxCount: number;
}) {
  const path = usePathname();
  const { open, setOpen } = useSidebar();
  const [desktop, setDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const hidden = !desktop && !open;

  return (
    <>
      {!desktop && open && (
        <button
          type="button"
          className="shell-scrim no-print"
          aria-label="Fechar navegação"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id="shell-nav"
        className={`shell-side no-print${open ? " is-open" : ""}`}
        aria-label={deal ? `Pilares · ${deal.name}` : "Navegação"}
        aria-hidden={hidden || undefined}
        inert={hidden ? true : undefined}
      >
        <div className="shell-side-scroll">
          <div className="shell-side-head">
            <p className="side-kicker">{deal ? "Deal" : "Navegação"}</p>
            <button type="button" className="shell-close" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>
          {deal ? (
            <DealNav deal={deal} mode={mode} path={path} />
          ) : (
            <ProductNav path={path} mode={mode} deals={deals} inboxCount={inboxCount} />
          )}
        </div>
      </aside>
    </>
  );
}

function DealNav({
  deal,
  mode,
  path,
}: {
  deal: ShellDealNav;
  mode: MeetingMode;
  path: string;
}) {
  const prefix = `/deals/${deal.slug}`;
  const segment = path.startsWith(`${prefix}/`) ? path.slice(prefix.length + 1).split("/")[0] : "";
  const reading = deal.pillars.some((p) => p.slug === segment) ? (segment as PillarSlug) : null;
  const here = reading ?? deal.phasePillar;
  const docPillar = reading ?? deal.phasePillar ?? deal.pillars[0]?.slug ?? null;
  const docsHref = docPillar ? `${prefix}/${docPillar}#documentos` : prefix;

  return (
    <>
      <p className="side-deal">{deal.name}</p>
      <nav className="side-pillars" aria-label="Pilares do processo">
        {deal.pillars.map((p) => {
          const current = here === p.slug;
          return (
            <Link
              key={p.slug}
              href={`${prefix}/${p.slug}`}
              className={`side-pillar${current ? " is-here" : ""}`}
              aria-current={reading === p.slug ? "page" : undefined}
            >
              <span className="side-num">{p.order}</span>
              <span className="side-copy">
                <span className="side-name">{p.short}</span>
                {current && <span className="side-aqui">aqui</span>}
              </span>
              <span className={`dot dot-${p.health}`} aria-hidden />
              <span className="sr-only">{semaphoreShortFor(mode, p.health)}</span>
            </Link>
          );
        })}
      </nav>
      <nav className="side-more" aria-label="Neste deal">
        {canSeeDecisions(mode) !== "hidden" && (
          <Link href="/decisions" className={isOn(path, "/decisions") ? "is-on" : undefined}>
            Decisões
          </Link>
        )}
        <Link href={docsHref}>Documentos</Link>
        <Link href={`${prefix}#opl`}>Pontos em aberto</Link>
      </nav>
    </>
  );
}

function ProductNav({
  path,
  mode,
  deals,
  inboxCount,
}: {
  path: string;
  mode: MeetingMode;
  deals: { slug: string; name: string; health: Semaphore }[];
  inboxCount: number;
}) {
  return (
    <nav className="side-product" aria-label="Programa">
      <Link href="/" className={`side-link${isOn(path, "/") ? " is-on" : ""}`}>
        Programa
      </Link>
      {deals.map((d) => (
        <Link
          key={d.slug}
          href={`/deals/${d.slug}`}
          className={`side-link${isOn(path, `/deals/${d.slug}`) ? " is-on" : ""}`}
        >
          <span className={`dot dot-${d.health}`} aria-hidden />
          <span className="side-name">{d.name}</span>
        </Link>
      ))}
      {canSeeInbox(mode) && (
        <Link href="/inbox" className={`side-link${isOn(path, "/inbox") ? " is-on" : ""}`}>
          Bandeja
          {inboxCount > 0 && <span className="side-badge">{inboxCount}</span>}
        </Link>
      )}
      {canSeeDecisions(mode) !== "hidden" && (
        <Link href="/decisions" className={`side-link${isOn(path, "/decisions") ? " is-on" : ""}`}>
          Decisões
        </Link>
      )}
      <Link href="/glossary" className={`side-link is-quiet${isOn(path, "/glossary") ? " is-on" : ""}`}>
        Glossário
      </Link>
    </nav>
  );
}
