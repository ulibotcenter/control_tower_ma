import { alertEmail, isResendConfigured } from "./config";
import { actions, risks } from "./data/seed";
import { listDecisions, unclassifiedCount } from "./data/store";

export type AlertPayload = {
  to: string;
  subject: string;
  text: string;
  kind: "weekly" | "inbox";
};

export async function buildWeeklyPayload(): Promise<AlertPayload> {
  const reds = risks.filter((r) => r.severity === "red").length;
  const late = actions.filter((a) => a.status === "late").length;
  const decisions = await listDecisions();
  const pending = 1; // a próxima decisão do board — objeto vivo da home
  const against = decisions.filter((d) => d.againstRecommendation).length;

  const text = [
    "Control Tower · Programa Go Live · AD+R",
    "",
    `Vermelhos (riscos que bloqueiam deal): ${reds}`,
    `Ações atrasadas: ${late}`,
    `Decisão pendente do board: ${pending} (tese + envelope de preço)`,
    `Decisões registradas contra a recomendação da Eleva: ${against}`,
    "",
    "A torre não atualiza a apresentação viva. Pack da semana: botão Publicar pack → Control Tower/Exports/.",
  ].join("\n");

  return {
    to: alertEmail(),
    subject: `[Go Live] Semana: ${reds} vermelhos · ${late} atrasadas · 1 decisão pendente`,
    text,
    kind: "weekly",
  };
}

export async function buildInboxPayload(fileName: string): Promise<AlertPayload> {
  const n = await unclassifiedCount();
  return {
    to: alertEmail(),
    subject: `[Go Live] Novo arquivo na bandeja: ${fileName}`,
    text: `Arquivo: ${fileName}\nNão classificados na bandeja: ${n}\nArquivo novo ≠ item concluído. Classifique em /inbox.`,
    kind: "inbox",
  };
}

export async function dispatchAlert(payload: AlertPayload) {
  if (!isResendConfigured()) {
    console.info("[alert:log-only]", JSON.stringify(payload, null, 2));
    return { sent: false, logged: true, to: payload.to };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.ALERT_FROM || "Control Tower <noreply@elevaprojects.com>",
      to: [payload.to],
      subject: payload.subject,
      text: payload.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[alert:resend-failed]", res.status, body);
    console.info("[alert:log-fallback]", JSON.stringify(payload, null, 2));
    return { sent: false, logged: true, to: payload.to, error: body };
  }

  return { sent: true, logged: false, to: payload.to };
}
