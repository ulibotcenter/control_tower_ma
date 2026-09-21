import type { ActionItem, OpenPoint, OpenPointStatus, Visibility } from "../types";
import { isUuid, parseActionStatus, parseOpenPointStatus } from "./room-input";
import { actions as seedActions, deals } from "./seed";
import {
  addAction,
  addOpenPoint,
  deleteAction,
  deleteOpenPoint,
  listExtraActions,
  listOpenPoints,
  supersedeAction,
  supersedeOpenPoint,
  updateAction,
  updateOpenPoint,
} from "./store";

export type RoomKind = "opl" | "task";

export type RoomPatch = {
  title?: string;
  owner?: string;
  due?: string;
  pillarSlug?: string | null;
  status?: string;
  visibility?: Visibility;
};

function slugOf(dealId: string) {
  return deals.find((deal) => deal.id === dealId)?.slug ?? "";
}

function pointStatusFromAction(status: ActionItem["status"]): OpenPointStatus {
  if (status === "done") return "resolvido";
  if (status === "late") return "travado";
  return "aberto";
}

function actionStatusFromPoint(status: OpenPointStatus): ActionItem["status"] {
  if (status === "resolvido") return "done";
  if (status === "travado") return "late";
  return "open";
}

type Live =
  | { fresh: true; kind: "task"; row: ActionItem; originId: string }
  | { fresh: false; kind: "opl"; row: OpenPoint; originId?: string }
  | { fresh: false; kind: "task"; row: ActionItem; originId?: string };

async function resolve(id: string, from: RoomKind): Promise<Live | null> {
  const [points, extra] = await Promise.all([listOpenPoints(), listExtraActions()]);
  if (isUuid(id)) {
    if (from === "opl") {
      const row = points.find((item) => item.id === id && !item.superseded);
      if (!row) return null;
      return { fresh: false, kind: "opl", row, originId: row.originId };
    }
    const row = extra.find((item) => item.id === id && !item.superseded);
    if (!row) return null;
    return { fresh: false, kind: "task", row, originId: row.originId };
  }

  const seed = seedActions.find((item) => item.id === id);
  if (!seed) return null;
  const point = points.find((item) => item.originId === id && !item.superseded);
  if (point) return { fresh: false, kind: "opl", row: point, originId: id };
  const action = extra.find((item) => item.originId === id && !item.superseded);
  if (action) return { fresh: false, kind: "task", row: action, originId: id };
  return { fresh: true, kind: "task", row: seed, originId: id };
}

function fields(source: Live, patch: RoomPatch) {
  const row = source.row;
  return {
    title: patch.title ?? row.title,
    owner: patch.owner ?? row.owner,
    due: patch.due ?? row.due,
    visibility: patch.visibility ?? row.visibility,
    pillarSlug: patch.pillarSlug !== undefined ? patch.pillarSlug : (row.pillarSlug ?? null),
  };
}

async function retire(source: Live) {
  if (source.fresh) return;
  if (source.kind === "opl") await supersedeOpenPoint(source.row.id);
  else await supersedeAction(source.row.id);
}

/**
 * Grava ponto ou tarefa. Id do corte (não-uuid) na primeira vez vira linha
 * com originId; a cópia do seed deixa de aparecer. dealId continua o do corte.
 */
export async function saveTrackedItem(input: {
  id: string;
  from: RoomKind;
  to: RoomKind;
  patch: RoomPatch;
}): Promise<{ kind: "opl"; point: OpenPoint } | { kind: "task"; action: ActionItem } | null> {
  const source = await resolve(input.id, input.from);
  if (!source) return null;
  const next = fields(source, input.patch);
  const dealId = source.row.dealId;
  const slug = slugOf(dealId);

  if (!source.fresh && source.kind === input.to) {
    if (source.kind === "opl") {
      const status = parseOpenPointStatus(input.patch.status);
      const point = await updateOpenPoint(source.row.id, {
        ...next,
        ...(status ? { status } : {}),
      });
      return point ? { kind: "opl", point } : null;
    }
    const status = parseActionStatus(input.patch.status);
    const action = await updateAction(source.row.id, {
      ...next,
      ...(status ? { status } : {}),
    });
    return action ? { kind: "task", action } : null;
  }

  if (input.to === "opl") {
    const status: OpenPointStatus =
      source.kind === "opl"
        ? (parseOpenPointStatus(input.patch.status) ?? source.row.status)
        : pointStatusFromAction(source.row.status);
    const point = await addOpenPoint({
      dealId,
      slug,
      title: next.title,
      owner: next.owner,
      due: next.due,
      pillarSlug: next.pillarSlug,
      status,
      visibility: next.visibility,
      sensitivities: source.row.sensitivities,
      originId: source.originId,
    });
    await retire(source);
    return { kind: "opl", point };
  }

  const status: ActionItem["status"] =
    source.kind === "task"
      ? (parseActionStatus(input.patch.status) ?? source.row.status)
      : actionStatusFromPoint(source.row.status);
  const action = await addAction({
    dealId,
    slug,
    workstreamSlug: source.kind === "task" ? source.row.workstreamSlug : null,
    pillarSlug: next.pillarSlug,
    title: next.title,
    owner: next.owner,
    due: next.due,
    status,
    visibility: next.visibility,
    sensitivities: source.row.sensitivities,
    originId: source.originId,
  });
  await retire(source);
  return { kind: "task", action };
}

export async function removeTrackedItem(id: string, from: RoomKind): Promise<boolean> {
  const source = await resolve(id, from);
  if (!source) return false;
  if (!source.fresh) {
    if (source.originId) {
      return source.kind === "opl" ? supersedeOpenPoint(source.row.id) : supersedeAction(source.row.id);
    }
    return source.kind === "opl" ? deleteOpenPoint(source.row.id) : deleteAction(source.row.id);
  }
  await addAction({
    dealId: source.row.dealId,
    workstreamSlug: source.row.workstreamSlug,
    pillarSlug: source.row.pillarSlug ?? null,
    title: source.row.title,
    owner: source.row.owner,
    due: source.row.due,
    status: source.row.status,
    visibility: source.row.visibility,
    sensitivities: source.row.sensitivities,
    slug: slugOf(source.row.dealId),
    originId: source.originId,
    superseded: true,
  });
  return true;
}
