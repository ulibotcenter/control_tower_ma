import type { MeetingMode } from "./types";

/**
 * Cópia e cromo de cada modo de reunião.
 * A regra de o que entra/sai da tela continua em lib/visibility.ts.
 * Aqui só o que cada público deve ler e quais blocos de UI fazem sentido.
 */
export const MODE_META: Record<
  MeetingMode,
  {
    label: string;
    short: string;
    hint: string;
    audience: string;
    shareLine: string;
    homeLead: string;
    homeSub?: string;
    boardKicker: string;
    snapshotRedLabel: (n: number) => string;
  }
> = {
  operate: {
    label: "Operar",
    short: "Operar",
    hint: "Eleva sozinha — bandeja, notas internas e registro",
    audience: "Só Eleva",
    shareLine: "Tudo visível: bandeja, notas internas e credenciais.",
    homeLead:
      "Duas compras buy-side da AD+R (Massa FM, Mix FM, Nova Brasil). Sponsors: Camila Kovacevick (CEO) e Matheus Vasconcelos (CFO). PMO Eleva. Jurídico: Pacta. Financeiro: João Amorim / M12C. A prioridade é a Loopert. Radio Health está em análise.",
    homeSub:
      "Cada deal tem workstreams. O semáforo no topo explica o ritmo. Ainda não há LOI nem SPA. Closing-alvo da Loopert: jan/2027, flexível.",
    boardKicker: "Próxima decisão do board",
    snapshotRedLabel: (n) =>
      `${n} ponto${n > 1 ? "s" : ""} vermelho${n > 1 ? "s" : ""}`,
  },
  advisors: {
    label: "Assessores",
    short: "Assessores",
    hint: "AD+R, Pacta e João Amorim na sala",
    audience: "AD+R · Pacta · M12C",
    shareLine: "Bandeja crua, notas da Eleva e credenciais estão ocultas.",
    homeLead:
      "Reunião com assessores. Loopert primeiro. Radio Health em análise. Sem bandeja, sem notas internas da Eleva, sem credenciais.",
    homeSub:
      "Tese, preço verbal e pendências compartilhadas com Pacta e João Amorim. O que o alvo não pode ver continua nesta tela — troque para Alvo se ele entrar.",
    boardKicker: "Decisão em mesa",
    snapshotRedLabel: (n) =>
      `${n} ponto${n > 1 ? "s" : ""} vermelho${n > 1 ? "s" : ""}`,
  },
  target: {
    label: "Alvo",
    short: "Alvo",
    // Sem citar nomes de operação: este texto vira title/aria-label do botão e
    // aparece no hover, na tela que está sendo projetada para o alvo.
    hint: "O alvo está na sala — some preço, tese e notas internas",
    audience: "Alvo na sala",
    shareLine: "Só fase, documentos pedidos e pendências formais.",
    homeLead:
      "Situação formal da operação em avaliação: fase, documentos pedidos e pendências. Semáforo no topo da tela.",
    boardKicker: "Situação formal",
    snapshotRedLabel: (n) =>
      `${n} pendência${n > 1 ? "s" : ""} formal${n > 1 ? "is" : ""}`,
  },
};

export function viewChrome(mode: MeetingMode, present: boolean) {
  return {
    showInbox: mode === "operate" && !present,
    showPack: mode === "operate" && !present,
    showRegisterDecision: mode === "operate" && !present,
    showThesis: mode !== "target" && !present,
    showCap: mode !== "target" && !present,
    showPeople: mode !== "target" && !present,
    showNotes: !present,
    showDocs: !present,
    showChecklist: !present,
    showWorkstreams: !present,
    showSearch: !present && mode !== "target",
    showFilters: !present && mode !== "target",
    showOperateAside: mode === "operate" && !present,
    showLegend: !present,
    compactBoards: present,
    showProductLine: !present && mode === "operate",
  };
}
