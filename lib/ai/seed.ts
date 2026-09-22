import type { AiProposal, AiRoomSeed } from "../types";

/** Campos do diálogo de ponto, tarefa ou nota, preenchidos a partir da proposta. */
export function seedFromProposal(row: AiProposal): AiRoomSeed | null {
  if (row.status !== "pendente") return null;
  if (row.kind === "opl" || row.kind === "tarefa") {
    const title = (row.payload.title || row.payload.text || "").trim();
    if (!title) return null;
    return {
      proposalId: row.id,
      kind: row.kind === "tarefa" ? "task" : "opl",
      title,
      owner: row.payload.owner ?? "",
      due: row.payload.due ?? "",
      pillarSlug: row.payload.pillarSlug ?? null,
      visibility: row.payload.visibility ?? "advisors",
      body: "",
    };
  }
  if (row.kind === "nota") {
    const body = (row.payload.body || row.payload.text || "").trim();
    if (!body) return null;
    return {
      proposalId: row.id,
      kind: "note",
      title: "",
      owner: "",
      due: "",
      pillarSlug: null,
      visibility: row.payload.visibility ?? "operate",
      body,
    };
  }
  return null;
}
