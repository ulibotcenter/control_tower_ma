import { SEMAPHORE_LABEL } from "./constants";
import type { MeetingMode } from "./types";

/**
 * Linguagem do modo Alvo — tudo que o alvo lê na tela passa por aqui.
 *
 * Duas regras, nesta ordem:
 *   1. Nada que denuncie a encenação: modos, o que some, quem mais existe
 *      no programa, que esta tela está sendo filtrada para ele.
 *   2. Vocabulário de reunião de M&A. Nada de jargão de software
 *      (checklist, dashboard, corte, bandeja, modo, vista).
 *
 * Centralizado num objeto só para que a revisão seja um diff de um arquivo,
 * e não uma caça a ternários espalhados pela árvore.
 */
export const TARGET_COPY = {
  homeKicker: "Operação em avaliação",
  homeTitle: "Situação formal",
  snapshotKicker: "Situação formal",
  activityKicker: "Registro",
  activityTitle: "Movimentações com data",
  activityLead: "Fatos com data registrada.",
  activityEmpty: "Nada novo desde a última atualização.",
  documentsKicker: "Documentos",
  documentsTitle: "Pendências documentais",
  metricsKicker: "Números formalizados",
  metricsEmpty: "Nenhum número formalizado até aqui. Os que faltam estão a confirmar.",
  /**
   * Rótulos do bloco "situação em 5 segundos" e da navegação de seções.
   * São neutros e servem aos três modos, mas moram aqui porque o alvo os lê.
   */
  phaseLabel: "Fase",
  healthLabel: "Situação",
  nextMilestoneLabel: "Próximo marco",
  navOverview: "Situação",
  navDocuments: "Documentos",
  navRisks: "Pendências",
  navActions: "Ações",
  navFiles: "Arquivos",
  navWorkstreams: "Frentes",
  navMetrics: "Números",
  criticalHint: "Pontos que precisam ser resolvidos para a operação avançar.",
  criticalEmpty: "Nenhum ponto crítico em aberto.",
  issuesHint: "Pontos em tratamento. Isoladamente não travam a operação.",
  issuesEmpty: "Nenhum ponto em tratamento.",
  /** Semáforo em linguagem de reunião: sinal de andamento, não de war-room. */
  semaphore: {
    green: "No prazo",
    amber: "Em curso",
    red: "Pendência em aberto",
    gray: "Não iniciada",
  } as Record<string, string>,
} as const;

/**
 * Em Operar o semáforo fala como a Eleva fala ("Bloqueia o deal"). No Alvo
 * fala como a sala fala: no prazo, em curso, pendência em aberto.
 */
export function semaphoreLabelFor(mode: MeetingMode, tone: string) {
  if (mode === "target") return TARGET_COPY.semaphore[tone] ?? SEMAPHORE_LABEL[tone];
  return SEMAPHORE_LABEL[tone];
}

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
      "Cada deal tem frentes: Legal, Financeiro, Comercial, Pessoas. O semáforo no topo explica o ritmo. Ainda não há LOI nem SPA. Closing-alvo da Loopert: jan/2027, flexível.",
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
    // Nunca vira title/aria-label quando o alvo pode ler a tela: o seletor de
    // modo usa o rótulo puro nesse caso (ver ModeSwitch, prop `quiet`).
    hint: "Visão formal da operação",
    audience: "Alvo na sala",
    shareLine: "Só fase, documentos pedidos e pendências formais.",
    homeLead:
      "Situação formal da operação em avaliação: fase atual, documentos pedidos e pendências em aberto.",
    boardKicker: "Situação formal",
    snapshotRedLabel: (n) => (n > 1 ? `${n} pendências formais` : "1 pendência formal"),
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
