"use client";

import { GLOSSARY, type GlossaryId } from "@/lib/glossary";

/**
 * Sigla com «?» discreto. A definição é a mesma da página Glossário.
 * interactive={false} quando o termo está dentro de um <a>/<Link>.
 */
export function Term({
  id,
  children,
  interactive = true,
}: {
  id: GlossaryId;
  children?: React.ReactNode;
  interactive?: boolean;
}) {
  const entry = GLOSSARY[id];
  if (!entry) return <>{children}</>;

  return (
    <span
      className="term-wrap hint-wrap relative inline-flex items-baseline gap-0.5"
      tabIndex={interactive ? 0 : undefined}
    >
      <span className="decoration-[#c2410c]/70 underline decoration-dotted underline-offset-4">
        {children ?? entry.term}
      </span>
      <span className="term-q" aria-hidden>
        ?
      </span>
      <span className="sr-only">. {entry.def}</span>
      <span role="tooltip" className="hint-tip">
        <span className="mb-0.5 block font-semibold text-cream">{entry.term}</span>
        {entry.def}
      </span>
    </span>
  );
}
