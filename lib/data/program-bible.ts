import type { PillarSlug } from "../pillars";

/**
 * História fixa do programa AD+R. A mesma lista nos dois deals.
 * A cor do nó continua o semáforo do deal. Não entra tarefa, trava nem OPL.
 */
export const PROGRAM_BIBLE: Record<PillarSlug, readonly string[]> = {
  preparacao: [
    "Kickoff AD+R × Eleva: mandato, sigilo e quem decide",
    "NDA nas pontas (comprador, alvo, assessores, Eleva)",
    "Pedido formal de data room à Loopert",
    "Contratação do assessor jurídico e do parceiro contábil-financeiro",
    "Regras de sala: o que o alvo vê, o que o board vê, o que fica na Eleva",
  ],
  dd: [
    "Abertura e organização do data room",
    "Frente legal (societário, contratos, passivo, anuências)",
    "Frente financeiro-fiscal (demonstrações, caixa, certidões)",
    "Frente pessoas e propriedade intelectual",
    "Frente comercial (carteira e contratos vs. receita)",
    "Relatório de findings e red flags para o board",
  ],
  estruturacao: [
    "Tese de aquisição",
    "Envelope de preço e condições",
    "Travas de terceiros (anuências)",
    "Term sheet / LOI",
    "Desenho da SPA e anexos",
  ],
  aprovacoes: [
    "Pack de board AD+R",
    "Aprovação societária do comprador",
    "Aprovação dos vendedores / sócios do alvo",
    "Condicionantes (certidões, anuências, encerramento de DD)",
  ],
  fechamento: [
    "SPA definitiva e documentos de closing",
    "Checagem das condições precedentes",
    "Assinatura e liquidação",
    "Comunicado interno (e externo, se couber)",
  ],
  pmi: [
    "D+1: governança da empresa comprada",
    "Pessoas-chave e retenção",
    "Sistemas, marca e operação comercial",
    "Plano de 100 dias: o que mediamos",
  ],
};
