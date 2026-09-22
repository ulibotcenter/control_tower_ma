"use client";

import { useState } from "react";
import { formatDate, dueSortKey } from "@/lib/format";
import { isUuid } from "@/lib/data/room-input";
import { OPL_FILTERS, pointInFilter, taskInFilter, type OplFilter } from "@/lib/opl-filter";
import { isPillarSlug, pillarOf, PILLAR_BY_SLUG } from "@/lib/pillars";
import type { ActionItem, OpenPoint, OpenPointStatus } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, actionTone } from "@/components/ui/status-badge";
import { WithTerms } from "@/components/ui/with-terms";
import { MutableStatus } from "./mutable-status";
import { PointRowMenu, TaskRowMenu } from "./room-bar";

const POINT_STATUS: { value: OpenPointStatus; label: string }[] = [
  { value: "aberto", label: "Aberto" },
  { value: "em_curso", label: "Em curso" },
  { value: "travado", label: "Travado" },
  { value: "resolvido", label: "Resolvido" },
];

const TASK_STATUS: { value: ActionItem["status"]; label: string }[] = [
  { value: "open", label: "Aberta" },
  { value: "late", label: "Atrasada" },
  { value: "done", label: "Concluída" },
];

type Line =
  | { kind: "point"; point: OpenPoint; at: string }
  | { kind: "task"; task: ActionItem; at: string };

function pillarLabel(slug: string | null | undefined) {
  if (!slug) return "—";
  return isPillarSlug(slug) ? PILLAR_BY_SLUG[slug].short : slug;
}

function byFresh(a: Line, b: Line) {
  if (a.at === b.at) {
    const title = a.kind === "point" ? a.point.title : a.task.title;
    const other = b.kind === "point" ? b.point.title : b.task.title;
    return title.localeCompare(other, "pt");
  }
  return a.at < b.at ? 1 : -1;
}

function seedRank(task: ActionItem) {
  return task.status === "open" ? 0 : 1;
}

function pointTone(status: OpenPointStatus) {
  if (status === "aberto") return "is-wash is-aberto";
  if (status === "em_curso") return "is-wash is-course";
  if (status === "travado") return "is-wash is-travado";
  return "is-wash is-feita";
}

function taskTone(status: ActionItem["status"]) {
  if (status === "late") return "is-hot";
  if (status === "open") return "is-wash is-aberto";
  return "is-wash is-feita";
}

function rowsOf(points: OpenPoint[], tasks: ActionItem[]): Line[] {
  const fresh: Line[] = [
    ...points.map((point) => ({ kind: "point" as const, point, at: point.createdAt || "" })),
    ...tasks
      .filter((task) => isUuid(task.id) && task.createdAt)
      .map((task) => ({ kind: "task" as const, task, at: task.createdAt || "" })),
  ].sort(byFresh);
  const olderFresh: Line[] = tasks
    .filter((task) => isUuid(task.id) && !task.createdAt)
    .map((task) => ({ kind: "task", task, at: "" }));
  const seed = tasks.filter((task) => !isUuid(task.id));
  const late: Line[] = seed
    .filter((task) => task.status === "late")
    .sort((a, b) => dueSortKey(a.due) - dueSortKey(b.due))
    .map((task) => ({ kind: "task", task, at: "" }));
  const rest: Line[] = seed
    .filter((task) => task.status !== "late")
    .sort((a, b) => seedRank(a) - seedRank(b) || dueSortKey(a.due) - dueSortKey(b.due))
    .map((task) => ({ kind: "task", task, at: "" }));
  return [...fresh, ...olderFresh, ...late, ...rest];
}

export function PendingTable({
  points,
  tasks,
  canEdit,
  empty = "Nenhum ponto em aberto neste deal.",
}: {
  points: OpenPoint[];
  tasks: ActionItem[];
  canEdit: boolean;
  empty?: string;
}) {
  const [filter, setFilter] = useState<OplFilter>("abertos");
  const all = rowsOf(points, tasks);
  const rows = all.filter((line) =>
    line.kind === "point" ? pointInFilter(line.point.status, filter) : taskInFilter(line.task.status, filter),
  );
  if (!all.length) return <EmptyState compact title={empty} />;

  return (
    <div className="ops-scroll">
      <table id="tarefas" className="data-table ops-table">
        <thead>
          <tr>
            <th scope="col">Tipo</th>
            <th scope="col">Descrição</th>
            <th scope="col">Responsável</th>
            <th scope="col">Prazo</th>
            <th scope="col">Pilar</th>
            <th scope="col">
              <span className="ops-status-head">
                Status
                <select
                  className="ops-status-filter no-print"
                  aria-label="Filtrar status"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as OplFilter)}
                >
                  {OPL_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </span>
            </th>
            <th scope="col">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="ops-empty">
                Nada neste filtro.
              </td>
            </tr>
          ) : null}
          {rows.map((line) =>
            line.kind === "point" ? (
              <tr key={`point-${line.point.id}`} className={pointTone(line.point.status)}>
                <td className="ops-tipo">Ponto</td>
                <td>
                  <span className="ops-strong">
                    <WithTerms text={line.point.title} interactive={false} />
                  </span>
                </td>
                <td className="ops-owner">{line.point.owner || "—"}</td>
                <td className="ops-due">{line.point.due ? formatDate(line.point.due) : "—"}</td>
                <td className="ops-meta-cell">{pillarLabel(line.point.pillarSlug)}</td>
                <td>
                  {canEdit ? (
                    <MutableStatus
                      id={line.point.id}
                      kind="open-points"
                      status={line.point.status}
                      options={POINT_STATUS}
                      label={`Status de ${line.point.title}`}
                    />
                  ) : (
                    POINT_STATUS.find((option) => option.value === line.point.status)?.label ?? line.point.status
                  )}
                </td>
                <td className="ops-row-actions">
                  {canEdit ? <PointRowMenu point={line.point} /> : null}
                </td>
              </tr>
            ) : (
              <tr key={`task-${line.task.id}`} className={taskTone(line.task.status)}>
                <td className="ops-tipo">Tarefa</td>
                <td>
                  <span className="ops-strong">
                    <WithTerms text={line.task.title} />
                  </span>
                </td>
                <td className="ops-owner">{line.task.owner || "—"}</td>
                <td className={line.task.status === "late" ? "ops-due is-late" : "ops-due"}>{formatDate(line.task.due)}</td>
                <td className="ops-meta-cell">{pillarLabel(pillarOf(line.task))}</td>
                <td>
                  {canEdit ? (
                    <MutableStatus
                      id={line.task.id}
                      kind="actions"
                      status={line.task.status}
                      options={TASK_STATUS}
                      label={`Status de ${line.task.title}`}
                    />
                  ) : (
                    <ActionStatus status={line.task.status} />
                  )}
                </td>
                <td className="ops-row-actions">
                  {canEdit ? <TaskRowMenu action={line.task} /> : null}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActionStatus({ status }: { status: ActionItem["status"] }) {
  const label = { late: "Atrasada", open: "Aberta", done: "Concluída" };
  return <StatusBadge tone={actionTone(status)}>{label[status]}</StatusBadge>;
}
