import { Fragment } from "react";
import { GLOSSARY_TOKEN_RE, glossaryIdFor } from "@/lib/glossary";
import { Term } from "./term";

/** Percorre um texto e envolve siglas conhecidas com o mesmo tooltip do glossário. */
export function WithTerms({
  text,
  interactive = true,
}: {
  text: string;
  interactive?: boolean;
}) {
  if (!text) return null;
  const re = new RegExp(GLOSSARY_TOKEN_RE.source, GLOSSARY_TOKEN_RE.flags);
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) => {
        const id = glossaryIdFor(part);
        if (id) {
          return (
            <Term key={`${id}-${i}`} id={id} interactive={interactive}>
              {part}
            </Term>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
