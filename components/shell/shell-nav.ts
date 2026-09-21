import type { PillarSlug } from "@/lib/pillars";
import type { Semaphore } from "@/lib/types";

/** Recorte mínimo para a sidebar. O bundle já passou pelo filtro do modo. */
export type ShellPillar = {
  slug: PillarSlug;
  order: number;
  short: string;
  health: Semaphore;
};

export type ShellDealNav = {
  slug: string;
  name: string;
  phasePillar: PillarSlug | null;
  pillars: ShellPillar[];
};
