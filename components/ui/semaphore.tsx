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
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <Dot tone={tone} />
      <span>{label ?? SEMAPHORE_LABEL[tone]}</span>
    </span>
  );
}
