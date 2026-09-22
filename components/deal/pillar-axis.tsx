import Link from "next/link";
import { WithTerms } from "@/components/ui/with-terms";
import { pillarAxisBullets, type PillarView } from "@/lib/data/pillar-view";
import { semaphoreShortFor } from "@/lib/mode-meta";
import type { MeetingMode } from "@/lib/types";

/**
 * Eixo vertical dos seis pilares. A cor sai do semáforo que o bundle já tem.
 * Os pontos são título de trava, título do próximo passo e o resumo do marco.
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
    <ol className="pillar-axis">
      {pillars.map((pillar) => {
        const bullets = pillarAxisBullets(pillar, mode);
        const href = `/deals/${dealSlug}/${pillar.slug}`;
        return (
          <li key={pillar.slug} className="pillar-axis-stop">
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
                  <li key={bullet.id}>
                    <WithTerms text={bullet.text} interactive={false} />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
