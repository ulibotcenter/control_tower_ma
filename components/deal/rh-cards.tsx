"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RhCardField } from "@/lib/data/rh-deck";
import type { RhPersonCard } from "@/lib/data/rh-people";

const FIELDS: readonly { field: RhCardField; label: string }[] = [
  { field: "role", label: "Função" },
  { field: "years", label: "Anos de empresa" },
  { field: "importance", label: "Importância (atual / PMI)" },
  { field: "salary", label: "Salário" },
  { field: "source", label: "Expectativa pós-aquisição" },
];

function Field({
  person,
  field,
  label,
  value,
  canEdit,
}: {
  person: string;
  field: RhCardField;
  label: string;
  value: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const skip = useRef(false);
  const saving = useRef(false);
  const [editing, setEditing] = useState(false);
  const [shown, setShown] = useState(value);
  const [draft, setDraft] = useState(value);
  const [failed, setFailed] = useState(false);

  async function commit() {
    if (skip.current) {
      skip.current = false;
      return;
    }
    if (saving.current) return;
    const next = draft.trim() || "—";
    if (next === shown) {
      setEditing(false);
      return;
    }
    saving.current = true;
    try {
      const res = await fetch("/api/rh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personName: person, field, value: next }),
      });
      if (!res.ok) {
        setFailed(true);
        setDraft(shown);
      } else {
        setFailed(false);
        setShown(next);
        router.refresh();
      }
    } finally {
      saving.current = false;
      setEditing(false);
    }
  }

  return (
    <div className="flex gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 flex-1">
        {canEdit && editing ? (
          <input
            className="rh-inline"
            autoFocus
            aria-label={`${label} de ${person}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => void commit()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
              if (event.key === "Escape") {
                skip.current = true;
                setDraft(shown);
                setEditing(false);
              }
            }}
          />
        ) : canEdit ? (
          <button
            type="button"
            className="rh-inline"
            onClick={() => {
              setDraft(shown);
              setFailed(false);
              setEditing(true);
            }}
          >
            {shown}
          </button>
        ) : (
          shown
        )}
        {failed ? <span className="ml-2 text-[12px] text-muted">Não gravou</span> : null}
      </dd>
    </div>
  );
}

export function RhCards({ cards, canEdit }: { cards: RhPersonCard[]; canEdit: boolean }) {
  if (!cards.length) return null;
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      {cards.map((card) => (
        <li key={card.name} className="paper px-4 py-3 text-sm">
          <p className="font-semibold text-navy">{card.name}</p>
          <dl className="mt-2 space-y-1 text-[13px]">
            {FIELDS.map((item) => (
              <Field
                key={item.field}
                person={card.name}
                field={item.field}
                label={item.label}
                value={card[item.field]}
                canEdit={canEdit}
              />
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}
