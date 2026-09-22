import Link from "next/link";
import { WithTerms } from "@/components/ui/with-terms";
import { PROGRAM_BIBLE } from "@/lib/data/program-bible";
import type { PillarView } from "@/lib/data/pillar-view";
import { semaphoreShortFor } from "@/lib/mode-meta";
import type { MeetingMode } from "@/lib/types";

/** Seta geométrica entre nós. Sem ícone figurativo. */
function RailArrow() {
  return (
    <svg className="pillar-rail-arrow" viewBox="0 0 20 8" aria-hidden="true">
      <path
        d="M0 4H16M12 1l4 3-4 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Eixo vertical dos seis pilares. A cor sai do semáforo que o bundle já tem.
 * Os pontos são a bíblia fixa do programa, a mesma em todo deal.
 * O trilho horizontal só leva até o pilar nesta página.
 */
export function PillarAxis({
  dealSlug,
  pillars,
  mode,
}: {
  dealSlug: string;
  pillars: PillarView[];
  mode: MeetingMode;
}) {
  return (
    <>
      <nav className="pillar-rail" aria-label="Trilho dos pilares">
        <ol>
          {pillars.map((pillar, index) => (
            <li key={pillar.slug}>
              {index > 0 ? <RailArrow /> : null}
              <a href={`#pilar-${pillar.slug}`} className={`pillar-rail-node is-${pillar.health}`}>
                <span className="pillar-rail-mark">{pillar.order}</span>
                <span className="pillar-rail-name">{pillar.short}</span>
                <span className="sr-only">{semaphoreShortFor(mode, pillar.health)}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <ol className="pillar-axis">
      {pillars.map((pillar) => {
        const bullets = PROGRAM_BIBLE[pillar.slug];
        const href = `/deals/${dealSlug}/${pillar.slug}`;
        return (
          <li id={`pilar-${pillar.slug}`} key={pillar.slug} className="pillar-axis-stop">
            <Link href={href} className={`pillar-axis-node is-${pillar.health}`}>
              <span className="pillar-axis-mark" aria-hidden>
                {pillar.order}
              </span>
              <span className="pillar-axis-name">{pillar.short}</span>
              <span className="sr-only">{semaphoreShortFor(mode, pillar.health)}</span>
            </Link>
            {bullets.length > 0 ? (
              <ul className="pillar-axis-notes">
                {bullets.map((bullet) => (
                  <li key={bullet}>
                    <WithTerms text={bullet} interactive={false} />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
      </ol>
    </>
  );
}
