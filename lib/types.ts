export type MeetingMode = "operate" | "advisors" | "target";

export type Visibility = "operate" | "advisors" | "target";

export type Semaphore = "green" | "amber" | "red" | "gray";

export type DealStatus = "active" | "standby" | "closed" | "dropped";

export type DealPhase =
  | "preparar"
  | "dd"
  | "estruturar"
  | "fechar"
  | "integrar"
  | "avaliacao"
  | "congelada";

export type DocumentType =
  | "nda"
  | "ata"
  | "transcricao"
  | "contrato"
  | "financeiro"
  | "outro";

export type DocumentStatus =
  | "rascunho"
  | "assinado"
  | "vigente"
  | "vencido"
  | "a_classificar";

export type ChecklistStatus =
  | "aberto"
  | "em_andamento"
  | "concluido"
  | "inexistente"
  | "bloqueado";

export type Sensitivity =
  | "sjdc"
  | "price"
  | "valuation"
  | "nda_eleva"
  | "hunter"
  | "adr_exposure"
  | "eleva_notes"
  | "credentials"
  | "walkaway";

export type DecisionWho = "board" | "eleva" | "pacta";

export interface Visible {
  visibility: Visibility;
  sensitivities: Sensitivity[];
}

export interface Deal {
  id: string;
  slug: string;
  name: string;
  legalName: string;
  cnpj: string;
  city: string;
  since?: string;
  product?: string;
  priority: number;
  status: DealStatus;
  phase: DealPhase;
  phaseLabel: string;
  headline: string;
  headlineTarget: string;
  health: Semaphore;
  healthReason: string;
  nextMilestone: string;
  nextMilestoneTarget: string;
  driveFolderId: string;
  driveFolderLabel: string;
}

export interface Workstream {
  id: string;
  dealId: string;
  slug: string;
  name: string;
  owner: string;
  health: Semaphore;
  summary: string;
  summaryTarget: string;
  visibility: Visibility;
  sensitivities: Sensitivity[];
}

export interface Milestone {
  id: string;
  dealId: string;
  slug: string;
  name: string;
  window: string;
  status: "done" | "current" | "upcoming";
  summary: string;
  summaryTarget: string;
}

export interface DriveDocument {
  id: string;
  dealId: string | null;
  title: string;
  driveUrl: string;
  driveId: string | null;
  folderId: string | null;
  type: DocumentType;
  workstreamSlug: string | null;
  status: DocumentStatus;
  classified: boolean;
  note?: string;
  visibility: Visibility;
  sensitivities: Sensitivity[];
}

export interface Risk {
  id: string;
  dealId: string;
  workstreamSlug: string | null;
  title: string;
  detail: string;
  severity: Semaphore;
  visibility: Visibility;
  sensitivities: Sensitivity[];
}

export interface ActionItem {
  id: string;
  dealId: string;
  workstreamSlug: string | null;
  title: string;
  owner: string;
  due: string;
  status: "open" | "late" | "done";
  visibility: Visibility;
  sensitivities: Sensitivity[];
}

export interface ChecklistItem {
  id: string;
  dealId: string;
  workstreamSlug: string;
  title: string;
  status: ChecklistStatus;
  documentId: string | null;
  driveUrl: string | null;
  note?: string;
  visibility: Visibility;
  sensitivities: Sensitivity[];
}

export interface Metric {
  id: string;
  dealId: string;
  label: string;
  value: string;
  context?: string;
  visibility: Visibility;
  sensitivities: Sensitivity[];
}

export interface Decision {
  id: string;
  dealId: string | null;
  who: DecisionWho;
  whoLabel: string;
  date: string;
  elevaRecommendation: string;
  decisionTaken: string;
  againstRecommendation: boolean;
  consequence: string;
}

export interface InboxFile {
  id: string;
  name: string;
  source: "manual" | "drive";
  driveUrl: string | null;
  driveId: string | null;
  receivedAt: string;
  classified: boolean;
  classification?: {
    dealId: string;
    type: DocumentType;
    workstreamSlug: string | null;
    status: DocumentStatus;
  };
}

export interface Note {
  id: string;
  dealId: string | null;
  body: string;
  visibility: Visibility;
  sensitivities: Sensitivity[];
}

export interface ThesisStep {
  id: string;
  dealId: string;
  order: number;
  date: string;
  label: string;
  current: boolean;
  visibility: Visibility;
  sensitivities: Sensitivity[];
}

export interface PriceStep {
  id: string;
  dealId: string;
  order: number;
  date: string;
  label: string;
  current: boolean;
  visibility: Visibility;
  sensitivities: Sensitivity[];
}

export interface CapRow {
  name: string;
  role: string;
  pct: string;
  note?: string;
}

export interface BoardCard {
  sentence: string;
  sentenceTarget: string;
  owner: string;
  date: string;
  dealId: string;
}

export interface DealBundle {
  deal: Deal;
  workstreams: Workstream[];
  milestones: Milestone[];
  documents: DriveDocument[];
  risks: Risk[];
  actions: ActionItem[];
  checklist: ChecklistItem[];
  metrics: Metric[];
  notes: Note[];
  thesis: ThesisStep[];
  prices: PriceStep[];
  capTable: CapRow[];
  people: { name: string; role: string; note: string; visibility: Visibility; sensitivities: Sensitivity[] }[];
}

export interface ProgramView {
  corte: string;
  board: BoardCard;
  deals: Array<
    Deal & {
      redCount: number;
      amberCount: number;
      topReds: string[];
    }
  >;
  driveConfigured: boolean;
  supabaseConfigured: boolean;
  dataBackend: "supabase" | "seed";
  resendConfigured: boolean;
  inboxUnclassified: number;
}

export interface SessionUser {
  email: string;
  name: string;
}
