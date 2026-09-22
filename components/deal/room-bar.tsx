"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { PILLARS, pillarOf, type PillarSlug } from "@/lib/pillars";
import { isUuid } from "@/lib/data/room-input";
import { toast } from "@/lib/toast";
import type { ActionItem, AiRoomSeed, Note, OpenPoint } from "@/lib/types";
import { useMeetingTab } from "./meeting-tabs";

const VISIBILITY = [
  { value: "operate", label: "Operar" },
  { value: "advisors", label: "Assessores" },
  { value: "target", label: "Alvo" },
] as const;

type Draft =
  | { mode: "create"; kind: "opl" | "task"; defaults?: AiRoomSeed }
  | { mode: "create"; kind: "note"; defaults: AiRoomSeed }
  | { mode: "edit"; kind: "opl"; point: OpenPoint }
  | { mode: "edit"; kind: "task"; action: ActionItem }
  | { mode: "edit"; kind: "note"; note: Note };

type RoomApi = {
  createPoint: () => void;
  createTask: () => void;
  editPoint: (point: OpenPoint) => void;
  editTask: (action: ActionItem) => void;
  editNote: (note: Note) => void;
  remove: (path: string, message: string) => Promise<void>;
};

const RoomContext = createContext<RoomApi | null>(null);

function useRoom() {
  return useContext(RoomContext);
}

function dateValue(due: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(due) ? due.slice(0, 10) : "";
}

export function RoomProvider({
  dealSlug,
  pillarSlug = null,
  seed = null,
  children,
}: {
  dealSlug: string;
  pillarSlug?: PillarSlug | null;
  seed?: AiRoomSeed | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function begin(next: Draft) {
    setError(null);
    setDraft(next);
    setFormKey((key) => key + 1);
  }

  useEffect(() => {
    if (formKey === 0) return;
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, [formKey]);

  const seedId = seed?.proposalId ?? "";
  useEffect(() => {
    if (!seed) return;
    setError(null);
    setDraft(
      seed.kind === "note"
        ? { mode: "create", kind: "note", defaults: seed }
        : { mode: "create", kind: seed.kind, defaults: seed },
    );
    setFormKey((key) => key + 1);
    // Abre uma vez por proposta. O seed em si não muda enquanto o id for o mesmo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedId]);

  async function remove(path: string, message: string) {
    if (!window.confirm(message)) return;
    try {
      const res = await fetch(path, { method: "DELETE" });
      if (!res.ok) {
        toast("Não foi possível excluir.");
        return;
      }
      toast("Excluído.");
      router.refresh();
    } catch {
      toast("Falha de rede.");
    }
  }

  const api: RoomApi = {
    createPoint: () => begin({ mode: "create", kind: "opl" }),
    createTask: () => begin({ mode: "create", kind: "task" }),
    editPoint: (point) => begin({ mode: "edit", kind: "opl", point }),
    editTask: (action) => begin({ mode: "edit", kind: "task", action }),
    editNote: (note) => begin({ mode: "edit", kind: "note", note }),
    remove,
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const kind = draft.kind;
    const editing = draft.mode === "edit";
    const defaults = draft.mode === "create" ? draft.defaults : undefined;
    const proposalId = defaults?.proposalId;
    let res: Response;
    try {
      if (draft.kind === "note") {
        const noteBody = {
          body: String(form.get("body") || ""),
          visibility: String(form.get("visibility") || "operate"),
        };
        res =
          draft.mode === "edit"
            ? await fetch(`/api/notes/${draft.note.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(noteBody),
              })
            : await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dealSlug, ...noteBody }),
              });
      } else {
        const current = editing ? (draft.kind === "opl" ? draft.point : draft.action) : null;
        const originalDue = current?.due ?? defaults?.due ?? "";
        let due = String(form.get("due") || "");
        if (!due && originalDue && !dateValue(originalDue)) due = originalDue;
        const chosen = String(form.get("kind") || "");
        const targetKind = chosen === "task" || chosen === "opl" ? chosen : kind;
        const postKind = defaults ? targetKind : kind;
        const payload = {
          dealSlug,
          title: String(form.get("title") || ""),
          owner: String(form.get("owner") || ""),
          due,
          pillarSlug: String(form.get("pillar") || "") || null,
          visibility: String(form.get("visibility") || "advisors"),
          ...(editing ? { kind: targetKind } : {}),
        };
        const path = current
          ? draft.kind === "opl"
            ? `/api/open-points/${current.id}`
            : `/api/actions/${current.id}`
          : postKind === "opl"
            ? "/api/open-points"
            : "/api/actions";
        res = await fetch(path, {
          method: current ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    } catch {
      setError("Falha de rede.");
      setBusy(false);
      return;
    }

    let data: { message?: string } = {};
    try {
      data = (await res.json()) as { message?: string };
    } catch {
      data = {};
    }
    if (!res.ok) {
      setError(data.message || "Não foi possível gravar.");
      setBusy(false);
      return;
    }
    if (proposalId) {
      try {
        await fetch(`/api/ai/proposals/${proposalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "editada" }),
        });
      } catch {
        toast("Gravado. A fila de propostas não atualizou.", "warn");
      }
    }
    toast(
      editing || proposalId
        ? "Alteração registrada."
        : kind === "note"
          ? "Nota registrada."
          : kind === "opl"
            ? "Ponto em aberto registrado."
            : "Tarefa registrada.",
    );
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    setBusy(false);
    router.refresh();
  }

  const editing = draft?.mode === "edit" ? draft : null;
  const defaults = draft?.mode === "create" ? draft.defaults : undefined;
  const note = editing?.kind === "note" ? editing.note : null;
  const point = editing?.kind === "opl" ? editing.point : null;
  const task = editing?.kind === "task" ? editing.action : null;
  const kind = draft?.kind ?? "opl";
  const heading = defaults
    ? kind === "note"
      ? "Editar nota"
      : kind === "opl"
        ? "Editar ponto"
        : "Editar tarefa"
    : kind === "note"
      ? "Editar nota"
      : draft?.mode === "edit"
        ? kind === "opl"
          ? "Editar ponto"
          : "Editar tarefa"
        : kind === "opl"
          ? "Novo ponto"
          : "Nova tarefa";

  return (
    <RoomContext.Provider value={api}>
      {children}
      <dialog
        ref={dialogRef}
        className="room-dialog"
        aria-labelledby="room-dialog-title"
        onClose={() => {
          if (!seedId) return;
          const url = new URL(window.location.href);
          if (!url.searchParams.has("proposta")) return;
          url.searchParams.delete("proposta");
          const next = `${url.pathname}${url.search}${url.hash}`;
          router.replace(next, { scroll: false });
        }}
      >
        <form key={formKey} onSubmit={onSubmit} className="grid gap-3">
          <h2 id="room-dialog-title" className="war-label">
            {heading}
          </h2>
          {kind === "note" ? (
            <div>
              <label htmlFor="room-body">Nota</label>
              <textarea id="room-body" name="body" rows={4} required maxLength={4000} defaultValue={note?.body ?? defaults?.body ?? ""} />
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="room-title">Descrição</label>
                <input id="room-title" name="title" required maxLength={280} defaultValue={defaults?.title ?? point?.title ?? task?.title ?? ""} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="room-owner">Responsável</label>
                  <input id="room-owner" name="owner" maxLength={120} defaultValue={defaults?.owner ?? point?.owner ?? task?.owner ?? ""} />
                </div>
                <div>
                  <label htmlFor="room-due">Prazo</label>
                  <input id="room-due" name="due" type="date" defaultValue={dateValue(defaults?.due ?? point?.due ?? task?.due ?? "")} />
                </div>
              </div>
            </>
          )}
          <div className={kind === "note" ? undefined : "grid gap-3 sm:grid-cols-2"}>
            {kind === "note" ? null : (
              <div>
                <label htmlFor="room-pillar">Pilar</label>
                <select id="room-pillar" name="pillar" defaultValue={pillarDefault(point, task, defaults?.pillarSlug || pillarSlug || "")}>
                  <option value="">Sem pilar</option>
                  {PILLARS.map((pillar) => (
                    <option key={pillar.slug} value={pillar.slug}>
                      {pillar.short}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(editing || defaults) && kind !== "note" ? (
              <div>
                <label htmlFor="room-kind">Tipo</label>
                <select id="room-kind" name="kind" defaultValue={kind === "task" ? "task" : "opl"}>
                  <option value="opl">Ponto</option>
                  <option value="task">Tarefa</option>
                </select>
              </div>
            ) : null}
            <div>
              <label htmlFor="room-visibility">Quem vê</label>
              <select
                id="room-visibility"
                name="visibility"
                defaultValue={defaults?.visibility ?? note?.visibility ?? point?.visibility ?? task?.visibility ?? (kind === "note" ? "operate" : "advisors")}
              >
                {VISIBILITY.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error ? <p className="text-sm text-alert">{error}</p> : null}
          <div className="room-actions">
            <button type="submit" className="btn btn-soft" disabled={busy}>
              {busy ? "Gravando…" : "Guardar"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => dialogRef.current?.close()}>
              Cancelar
            </button>
          </div>
        </form>
      </dialog>
    </RoomContext.Provider>
  );
}

export function RoomStrip() {
  const tab = useMeetingTab();
  const room = useRoom();
  if (!room) return null;
  if (tab === "anotacoes") {
    const hasComposer = typeof document !== "undefined" && Boolean(document.getElementById("nova-nota"));
    if (!hasComposer) return null;
    return (
      <button
        type="button"
        className="btn btn-soft"
        onClick={() => document.getElementById("nova-nota")?.focus()}
      >
        + Nota
      </button>
    );
  }
  return (
    <>
      <button type="button" className="btn btn-soft" onClick={room.createPoint}>
        + Ponto
      </button>
      <button type="button" className="btn btn-line" onClick={room.createTask}>
        + Tarefa
      </button>
    </>
  );
}

function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <span className="row-menu">
      <button type="button" onClick={onEdit}>
        Editar
      </button>
      <button type="button" onClick={onDelete}>
        Excluir
      </button>
    </span>
  );
}

function pillarDefault(point: OpenPoint | null, task: ActionItem | null, fallback: string) {
  if (point?.pillarSlug) return point.pillarSlug;
  if (task?.pillarSlug) return task.pillarSlug;
  if (task?.workstreamSlug) return pillarOf(task);
  return fallback;
}

export function PointRowMenu({ point }: { point: OpenPoint }) {
  const room = useRoom();
  if (!room) return null;
  return (
    <RowMenu
      onEdit={() => room.editPoint(point)}
      onDelete={() => void room.remove(`/api/open-points/${point.id}`, "Excluir este ponto?")}
    />
  );
}

export function TaskRowMenu({ action }: { action: ActionItem }) {
  const room = useRoom();
  if (!room) return null;
  return (
    <RowMenu
      onEdit={() => room.editTask(action)}
      onDelete={() => void room.remove(`/api/actions/${action.id}`, "Excluir esta tarefa?")}
    />
  );
}

export function NoteRowMenu({ note }: { note: Note }) {
  const room = useRoom();
  if (!room || !isUuid(note.id)) return null;
  return (
    <RowMenu
      onEdit={() => room.editNote(note)}
      onDelete={() => void room.remove(`/api/notes/${note.id}`, "Excluir esta nota?")}
    />
  );
}
