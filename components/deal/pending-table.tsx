"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDate, dueSortKey } from "@/lib/format";
import { isUuid } from "@/lib/data/room-input";
import { OPL_CHIPS, OPL_DEFAULT, applyOplDraft, pointInChips, taskInChips, type OplChip } from "@/lib/opl-filter";
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

/** Menu no body: à direita do botão, ou à esquerda se não cabe na viewport. */
export function statusPopoverBox(
  anchor: { left: number; right: number; bottom: number },
  menuWidth: number,
  viewportWidth: number,
  pad = 8,
  gap = 4,
) {
  const width = Math.max(220, menuWidth);
  let left = anchor.left;
  if (left + width > viewportWidth - pad) left = anchor.right - width;
  if (left < pad) left = pad;
  return { top: anchor.bottom + gap, left };
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
  const [chips, setChips] = useState<OplChip[]>(OPL_DEFAULT);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<OplChip[]>(OPL_DEFAULT);
  const [box, setBox] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const popRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const all = rowsOf(points, tasks);
  const rows = all.filter((line) =>
    line.kind === "point" ? pointInChips(line.point.status, chips) : taskInChips(line.task.status, chips),
  );

  const place = useCallback(() => {
    const anchor = btnRef.current;
    if (!anchor) return;
    setBox(statusPopoverBox(anchor.getBoundingClientRect(), menuRef.current?.offsetWidth ?? 0, window.innerWidth));
  }, []);

  const setMenuNode = useCallback(
    (node: HTMLDivElement | null) => {
      menuRef.current = node;
      if (node) place();
    },
    [place],
  );

  useEffect(() => {
    if (!open) return;
    place();
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (popRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  if (!all.length) return <EmptyState compact title={empty} />;

  function toggleDraft(value: OplChip) {
    setDraft((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

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
              <div className="ops-status-pop" ref={popRef}>
                <button
                  ref={btnRef}
                  type="button"
                  className="ops-status-btn"
                  aria-expanded={open}
                  aria-haspopup="dialog"
                  onClick={() => {
                    setDraft(chips);
                    if (btnRef.current) {
                      setBox(statusPopoverBox(btnRef.current.getBoundingClientRect(), 220, window.innerWidth));
                    }
                    setOpen((current) => !current);
                  }}
                >
                  Status ▾
                </button>
                {open && typeof document !== "undefined"
                  ? createPortal(
                      <div
                        ref={setMenuNode}
                        className="ops-status-menu no-print"
                        role="dialog"
                        aria-label="Filtrar status"
                        style={{ top: box.top, left: box.left }}
                      >
                        {OPL_CHIPS.map((option) => (
                          <label key={option.value} className="ops-status-tick">
                            <input
                              type="checkbox"
                              checked={draft.includes(option.value)}
                              onChange={() => toggleDraft(option.value)}
                            />
                            {option.label}
                          </label>
                        ))}
                        <button
                          type="button"
                          className="btn btn-soft ops-status-apply"
                          onClick={() => {
                            setChips(applyOplDraft(draft));
                            setOpen(false);
                          }}
                        >
                          Aplicar
                        </button>
                      </div>,
                      document.body,
                    )
                  : null}
              </div>
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
