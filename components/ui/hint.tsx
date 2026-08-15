"use client";

/**
 * Dica curta, visível no hover/foco e anunciada ao leitor de tela.
 * Use interactive={false} quando o Hint estiver dentro de um <a>/<Link>.
 */
export function Hint({
  label,
  children,
  interactive = true,
}: {
  label: string;
  children: React.ReactNode;
  interactive?: boolean;
}) {
  return (
    <span
      className="hint-wrap relative inline-flex items-center gap-1"
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
      <span
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-current text-[9px] leading-none text-current"
        aria-hidden
      >
        ?
      </span>
      <span className="sr-only">. {label}</span>
      <span role="tooltip" className="hint-tip">
        {label}
      </span>
    </span>
  );
}
