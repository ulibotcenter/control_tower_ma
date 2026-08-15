export const PROGRAM_NAME = "Go Live";
export const PROGRAM_SPONSOR = "AD+R";
export const CORTE = "14/08/2026";
export const PMO = "Eleva Projects";
export const PMO_CNPJ = "67.212.016/0001-39";
export const PMO_LEAD = "Erica Oliveira";
export const ALERT_EMAIL_DEFAULT = "erica@elevaprojects.com";
export const ALLOWED_EMAIL_DOMAIN = "elevaprojects.com";

export const DRIVE_ROOT_ID = "1VlZu-j9unQWpcjf9oqEkLIyIzjUiJAuS";
export const DRIVE_ROOT_NAME = "M&A - AD+R & Loopert";
export const DRIVE_EXPORTS_PATH = "Control Tower/Exports/";

export const DRIVE_FOLDERS = {
  root: { id: "1VlZu-j9unQWpcjf9oqEkLIyIzjUiJAuS", name: "M&A - AD+R & Loopert" },
  apresentacoes: { id: "1kIAentiht-Y8FD3KXwwF8GFmIH0CTrGW", name: "Apresentacoes" },
  auxiliares: { id: "1TzlsTcF9CjaQix7Qutzz_imoMRLr7r0_", name: "Arquivos auxiliares" },
  audio: { id: "1m8gJ-bA3RE0z2eZpXwT6L6Gybka1CXE3", name: "Audio_in" },
  health: { id: "1W79DHLhWdBbNmaLv6rOg7TM48geXOCGy", name: "Doctos HeathData" },
  loopert: { id: "1Fi_xf7JV8qvgMFf1CTkQByTW2wCEXc6y", name: "Doctos Loopert" },
  opl: { id: "1USrCFKi4l_BeamXURb8y-fkWN01Muc_t", name: "Open Point List" },
  relatorios: { id: "14mC-02UdXKihrYzMlGb3LzhGUxDRQ3Q5", name: "Relatorios" },
  transcricoes: { id: "14-obV-U7Pf87UC8gqGY5H4ow0aeuEpHI", name: "Transcricoes" },
} as const;

/** Nunca indexar nem linkar. */
export const DRIVE_DO_NOT_INDEX = {
  id: "12xWppq_hQ7tYFuM4hBBlK7ZN8UdkP-Dq",
  name: ".obsidian",
} as const;

export const DRIVE_ROOT_FILES = [
  {
    id: "1VzXp2FeeDU2wXEwGACDOI8QXppS0Sqkq",
    name: "AGENTS.md",
  },
  {
    id: "13RbJJYz-MzC7YPcYJcD2ElR8yJTdCXey",
    name: "Comandos.xlsx",
  },
  {
    id: "10sUIo-ywKx_uvYt4udZgoCdi2p__WbNn",
    name: "Prompt atualizar pptx",
  },
] as const;

export function folderUrl(id: string) {
  return `https://drive.google.com/drive/folders/${id}`;
}

export function fileUrl(id: string) {
  return `https://drive.google.com/file/d/${id}/view`;
}

export const MODE_LABEL: Record<string, string> = {
  operate: "Operar",
  advisors: "Reunião · Assessores",
  target: "Reunião · Alvo",
};

export const SEMAPHORE_LABEL: Record<string, string> = {
  green: "No prazo",
  amber: "Atenção",
  red: "Bloqueia o deal",
  gray: "Ainda não começou",
};

export const DOC_TYPE_LABEL: Record<string, string> = {
  nda: "NDA",
  ata: "Ata",
  transcricao: "Transcrição",
  contrato: "Contrato",
  financeiro: "Financeiro",
  outro: "Outro",
};

export const DOC_STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  assinado: "Assinado",
  vigente: "Vigente",
  vencido: "Vencido",
  a_classificar: "A classificar",
};

export const CHECK_STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  inexistente: "Declarado inexistente",
  bloqueado: "Bloqueado",
};

export const WHO_LABEL: Record<string, string> = {
  board: "Board AD+R",
  eleva: "Eleva",
  pacta: "Pacta",
};

export const WS_LABEL: Record<string, string> = {
  legal: "Legal",
  financeiro: "Financeiro",
  comercial: "Comercial",
  "pessoas-pi": "Pessoas / PI",
  operacional: "Operacional",
  negociacao: "Negociação",
  integracao: "Integração",
};

export function workstreamLabel(slug: string | null | undefined) {
  if (!slug) return "—";
  return WS_LABEL[slug] ?? slug;
}
