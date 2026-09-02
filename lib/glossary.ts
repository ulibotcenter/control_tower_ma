/**
 * Fonte única das definições.
 * Tooltip (Term) e página /glossary leem o mesmo `def`.
 * Linguagem para o board: factual, curta, sem jargão solto.
 */

export type GlossaryCategory = "ma" | "projeto" | "financeiro";

export type GlossaryAudience = "all" | "advisors" | "operate";

export type GlossaryEntry = {
  id: string;
  term: string;
  def: string;
  category: GlossaryCategory;
  aliases?: string[];
  audience?: GlossaryAudience;
};

export const CATEGORY_LABEL: Record<GlossaryCategory, string> = {
  ma: "M&A",
  projeto: "Projeto",
  financeiro: "Financeiro",
};

export const GLOSSARY_LIST: GlossaryEntry[] = [
  {
    id: "ma",
    term: "M&A",
    def: "Mergers and Acquisitions — fusões e aquisições. Compra, venda ou junção de empresas.",
    category: "ma",
    aliases: ["M&A", "M&amp;A"],
  },
  {
    id: "buy-side",
    term: "Buy-side",
    def: "Lado comprador. Aqui a AD+R é quem avalia comprar — não quem está à venda.",
    category: "ma",
    aliases: ["buy-side"],
  },
  {
    id: "deal",
    term: "Deal",
    def: "A operação de compra em curso. Neste programa há dois: Loopert e Radio Health.",
    category: "ma",
  },
  {
    id: "alvo",
    term: "Alvo",
    def: "A empresa que está sendo avaliada para compra. Aqui: Loopert ou Radio Health.",
    category: "ma",
  },
  {
    id: "loi",
    term: "LOI",
    def: "Letter of Intent — carta de intenções que formaliza o interesse em avançar na negociação.",
    category: "ma",
    aliases: ["LOI"],
  },
  {
    id: "spa",
    term: "SPA",
    def: "Share Purchase Agreement — contrato definitivo de compra das quotas ou ações.",
    category: "ma",
    aliases: ["SPA"],
  },
  {
    id: "nda",
    term: "NDA",
    def: "Non-Disclosure Agreement — acordo de confidencialidade. Quem assina não pode espalhar o que viu na pasta.",
    category: "ma",
    aliases: ["NDA", "NDAs"],
  },
  {
    id: "dd",
    term: "DD",
    def: "Due diligence — revisão de documentos, números, contratos e riscos da empresa antes de assinar.",
    category: "ma",
    aliases: ["DD", "due diligence", "Due diligence", "Due Diligence"],
  },
  {
    id: "closing",
    term: "Closing",
    def: "Fechamento — o dia em que se assina, paga e transfere o controle, depois das condições precedentes.",
    category: "ma",
    aliases: ["Closing", "closing"],
  },
  {
    id: "cp",
    term: "CP",
    def: "Condições precedentes — o que precisa estar verdadeiro antes do fechamento. Sem CP cumprida, não se paga e não se transfere o controle.",
    category: "ma",
    aliases: ["CP", "CPs"],
  },
  {
    id: "escrow",
    term: "Escrow",
    def: "Depósito em garantia. Parte do preço fica retida e só é liberada se condições combinadas forem cumpridas.",
    category: "ma",
    aliases: ["Escrow", "escrow"],
  },
  {
    id: "valuation",
    term: "Valuation",
    def: "Avaliação de quanto a empresa vale. Aqui ainda é leitura — não há número fechado pelo board.",
    category: "ma",
    aliases: ["valuation", "Valuation"],
    audience: "advisors",
  },
  {
    id: "tese",
    term: "Tese",
    def: "A razão de comprar: o que a AD+R quer fazer com a empresa depois. Ainda não está fechada com a Pacta.",
    category: "ma",
  },
  {
    id: "envelope",
    term: "Envelope de preço",
    def: "Faixa de valor que o board autoriza a Pacta a usar na estruturação. Sem envelope não há LOI.",
    category: "ma",
    aliases: ["envelope", "Envelope"],
    audience: "advisors",
  },
  {
    id: "cap",
    term: "Cap table",
    def: "Quadro societário — quem é sócio e com que percentual.",
    category: "ma",
    aliases: ["cap table", "Cap table"],
    audience: "advisors",
  },
  {
    id: "pmi",
    term: "PMI",
    def: "Post-Merger Integration — integração após a fusão ou aquisição. Só começa depois do fechamento.",
    category: "ma",
    aliases: ["PMI"],
  },
  {
    id: "walkaway",
    term: "Walkaway",
    def: "Ponto em que a Eleva recomenda não seguir. Leitura interna — não é posição oficial e não vai para a mesa.",
    category: "ma",
    audience: "operate",
  },
  {
    id: "rofr",
    term: "ROFR",
    def: "Right of First Refusal — direito de preferência. Quem tem ROFR pode igualar uma oferta antes de um terceiro entrar.",
    category: "ma",
    aliases: ["ROFR"],
    audience: "advisors",
  },
  {
    id: "anuencia",
    term: "Anuência",
    def: "Autorização formal de quem tem poder de vetar o deal. Sem a anuência da TARGA, a compra da Loopert é nula.",
    category: "ma",
    aliases: ["anuência", "Anuência"],
  },
  {
    id: "keyman",
    term: "Key-man",
    def: "Pessoa sem a qual o negócio perde valor. Precisa de contrato de permanência.",
    category: "ma",
    aliases: ["key-man", "Key-man"],
    audience: "advisors",
  },
  {
    id: "standby",
    term: "Stand-by",
    def: "Na tela aparece como «Em análise»: operação sem andamento ativo. Não é abandono — o programa trata a outra compra primeiro.",
    category: "projeto",
    aliases: ["Stand-by", "stand-by"],
  },
  {
    id: "targa",
    term: "TARGA",
    def: "Credora e investidora da Loopert, com mútuo conversível e direitos de veto. Sem a anuência dela o deal é nulo.",
    category: "ma",
    aliases: ["TARGA"],
  },
  {
    id: "sjdc",
    term: "SJDC",
    def: "Lançamentos financeiros sensíveis em revisão. Pedir justificativa por escrito — sem confrontar o alvo.",
    category: "financeiro",
    aliases: ["SJDC"],
    audience: "advisors",
  },
  {
    id: "dataroom",
    term: "Data room",
    def: "Pasta de documentos da operação. Aqui a verdade dos arquivos é o Google Drive.",
    category: "ma",
    aliases: ["data room", "Data room"],
  },
  {
    id: "minuta",
    term: "Minuta",
    def: "Rascunho de contrato. Um PDF chamado «assinado» ainda pode ser minuta.",
    category: "ma",
  },
  {
    id: "ata",
    term: "Ata",
    def: "Registro escrito do que foi combinado numa reunião. Áudio sem ata ainda não é decisão formal.",
    category: "projeto",
  },
  {
    id: "pmo",
    term: "PMO",
    def: "Project Management Office — quem organiza prazos e pendências do programa. Neste caso é a Eleva.",
    category: "projeto",
    aliases: ["PMO"],
  },
  {
    id: "workstream",
    // A palavra "workstream" não aparece mais na tela; o verbete fica com o
    // nome que o usuário lê. Os aliases seguem para não mudar o auto-link.
    term: "Frente",
    def: "Frente de trabalho da operação — Legal, Financeiro, Comercial, Pessoas/PI, Operacional, Negociação, Integração. Cada uma tem dono e semáforo.",
    category: "projeto",
    aliases: ["workstream", "Workstream", "workstreams", "Workstreams"],
  },
  {
    id: "semaforo",
    term: "Semáforo",
    def: "Verde: no ritmo. Âmbar: atenção, ainda não trava. Vermelho: precisa resolver antes de avançar. Cinza: a etapa não começou.",
    category: "projeto",
    aliases: ["semáforo", "Semáforo", "semaforo"],
  },
  {
    id: "milestone",
    term: "Marco",
    def: "Etapa concreta da linha do tempo (preparar, DD, estruturar, fechar, integrar).",
    category: "projeto",
    aliases: ["milestone", "marco"],
  },
  {
    id: "sponsor",
    term: "Sponsor",
    def: "Quem no board é dono da decisão. Aqui: Camila (CEO) e Matheus (CFO).",
    category: "projeto",
    aliases: ["Sponsors", "sponsors", "Sponsor"],
  },
  {
    id: "kpi",
    term: "KPI",
    def: "Key Performance Indicator — número que o board acompanha para saber se a frente anda.",
    category: "projeto",
    aliases: ["KPI", "KPIs"],
  },
  {
    id: "corte",
    term: "Corte",
    def: "A fotografia oficial da torre nesta data. O que não está no corte 02/09/2026 ainda é «a confirmar».",
    category: "projeto",
    audience: "advisors",
  },
  {
    id: "pack",
    term: "Pack",
    def: "Resumo da semana (markdown) para arquivo. Não atualiza a apresentação viva no Drive.",
    category: "projeto",
  },
  {
    id: "issue",
    term: "Issue",
    def: "Problema já identificado, em tratamento. Sozinho ainda não é deal-breaker.",
    category: "projeto",
  },
  {
    id: "ceo",
    term: "CEO",
    def: "Chief Executive Officer — presidente-executivo. Na AD+R: Camila Kovacevick.",
    category: "projeto",
    aliases: ["CEO"],
  },
  {
    id: "cfo",
    term: "CFO",
    def: "Chief Financial Officer — diretor financeiro. Na AD+R: Matheus Vasconcelos.",
    category: "projeto",
    aliases: ["CFO"],
  },
  {
    id: "dre",
    term: "DRE",
    def: "Demonstração do Resultado do Exercício — a conta de quanto a empresa ganhou ou perdeu no período.",
    category: "financeiro",
    aliases: ["DRE"],
  },
  {
    id: "pl",
    term: "PL",
    def: "Patrimônio líquido — ativos menos passivos. PL negativo significa que as dívidas superam o que a empresa tem.",
    category: "financeiro",
    aliases: ["PL"],
  },
  {
    id: "cnpj",
    term: "CNPJ",
    def: "Cadastro Nacional da Pessoa Jurídica — o «CPF» da empresa na Receita.",
    category: "financeiro",
    aliases: ["CNPJ"],
  },
  {
    id: "mutuo",
    term: "Mútuo",
    def: "Empréstimo entre empresas ou sócios. O da TARGA pode virar participação se converter.",
    category: "financeiro",
    aliases: ["Mútuo", "mútuo"],
  },
  {
    id: "postmoney",
    term: "Post-money",
    def: "Valor da empresa depois de entrar o dinheiro do investidor. Usado para calcular o percentual de quem converte dívida em sócio.",
    category: "financeiro",
    aliases: ["post-money", "Post-money"],
    audience: "advisors",
  },
  {
    id: "ytd",
    term: "YTD",
    def: "Year to date — acumulado desde 1º de janeiro até a data do corte.",
    category: "financeiro",
    aliases: ["YTD"],
    audience: "advisors",
  },
  {
    id: "pi",
    term: "PI",
    def: "Propriedade intelectual — software, marca, código. Sem cessão formal, o comprador não fica dono do que o time criou.",
    category: "ma",
    aliases: ["PI"],
  },
];

export const GLOSSARY = Object.fromEntries(GLOSSARY_LIST.map((e) => [e.id, e])) as Record<
  string,
  GlossaryEntry
>;

export type GlossaryId = (typeof GLOSSARY_LIST)[number]["id"];

const ALIAS_TO_ID: Record<string, GlossaryId> = {};
const aliasParts: string[] = [];

for (const entry of GLOSSARY_LIST) {
  const keys = [entry.term, ...(entry.aliases ?? [])];
  for (const key of keys) {
    ALIAS_TO_ID[key.toLowerCase()] = entry.id;
    aliasParts.push(key);
  }
}

aliasParts.sort((a, b) => b.length - a.length);

export const GLOSSARY_TOKEN_RE = new RegExp(
  `(?<![\\p{L}\\p{N}])(${aliasParts.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\p{L}\\p{N}])`,
  "gu",
);

export function glossaryIdFor(token: string): GlossaryId | null {
  return ALIAS_TO_ID[token.toLowerCase()] ?? null;
}

export function glossaryVisible(
  entry: GlossaryEntry,
  mode: "operate" | "advisors" | "target",
): boolean {
  const aud = entry.audience ?? "all";
  if (aud === "all") return true;
  if (aud === "operate") return mode === "operate";
  return mode !== "target";
}
