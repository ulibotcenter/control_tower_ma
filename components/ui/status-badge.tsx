export type StatusTone = "critical" | "late" | "progress" | "done" | "watch";

const TONE: Record<StatusTone, string> = {
  critical: "status-badge status-critical",
  late: "status-badge status-late",
  progress: "status-badge status-progress",
  done: "status-badge status-done",
  watch: "status-badge status-watch",
};

export function StatusBadge({
  tone,
  children,
}: {
  tone: StatusTone;
  children: React.ReactNode;
}) {
  return <span className={TONE[tone]}>{children}</span>;
}

export function actionTone(status: "open" | "late" | "done"): StatusTone {
  if (status === "late") return "late";
  if (status === "done") return "done";
  return "progress";
}

export function riskTone(severity: "green" | "amber" | "red" | "gray"): StatusTone {
  if (severity === "red") return "critical";
  if (severity === "amber") return "progress";
  if (severity === "green") return "done";
  return "watch";
}

export function checklistTone(
  status: "aberto" | "em_andamento" | "concluido" | "inexistente" | "bloqueado",
): StatusTone {
  if (status === "concluido") return "done";
  if (status === "inexistente" || status === "bloqueado") return "critical";
  if (status === "em_andamento") return "progress";
  return "watch";
}

export function documentTone(
  status: "rascunho" | "assinado" | "vigente" | "vencido" | "a_classificar",
): StatusTone {
  if (status === "vencido") return "late";
  if (status === "assinado" || status === "vigente") return "done";
  if (status === "rascunho" || status === "a_classificar") return "progress";
  return "watch";
}
