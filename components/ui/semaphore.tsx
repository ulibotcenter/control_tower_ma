import { SEMAPHORE_LABEL } from "@/lib/constants";
import type { Semaphore } from "@/lib/types";

export function Dot({ tone, size = "md" }: { tone: Semaphore; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-2 w-2" : "";
  return <span className={`dot dot-${tone} ${cls}`} aria-hidden />;
}

export function SemaphoreBadge({
  tone,
  label,
}: {
  tone: Semaphore;
  label?: string;
}) {
  const text = label ?? SEMAPHORE_LABEL[tone];
  return (
    <span className="inline-flex items-center gap-2 text-sm" aria-label={`Semáforo: ${text}`}>
      <Dot tone={tone} />
      <span>{text}</span>
    </span>
  );
}
