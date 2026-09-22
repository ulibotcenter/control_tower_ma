"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { buildDocTree, type DocTreeFile, type DocTreeFolder } from "@/lib/data/doc-groups";
import type { DriveDocument } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";

function FolderDriveIcon({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="doc-tree-open"
      aria-label="Abrir pasta"
      title="Abrir pasta"
    >
      <ArrowUpRight aria-hidden />
    </a>
  );
}

function TreeFile({ file, depth }: { file: DocTreeFile; depth: number }) {
  return (
    <div className="doc-tree-row" role="treeitem" aria-selected={false} style={{ paddingLeft: `${depth * 1.05}rem` }}>
      <span className="doc-tree-chevron doc-tree-spacer" aria-hidden />
      {file.href ? (
        <a
          href={file.href}
          target="_blank"
          rel="noopener noreferrer"
          className="doc-tree-file doc-tree-link"
          title={file.name}
        >
          {file.name}
        </a>
      ) : (
        <span className="doc-tree-file" title={file.name}>
          {file.name}
        </span>
      )}
      <span className="doc-tree-mark">{file.mark}</span>
    </div>
  );
}

function TreeFolder({
  folder,
  depth,
  open,
  toggle,
}: {
  folder: DocTreeFolder;
  depth: number;
  open: ReadonlySet<string>;
  toggle: (id: string) => void;
}) {
  const isOpen = open.has(folder.id);
  return (
    <div role="treeitem" aria-expanded={isOpen} aria-selected={false} aria-label={folder.name}>
      <div className="doc-tree-row" style={{ paddingLeft: `${depth * 1.05}rem` }}>
        <button type="button" className="doc-tree-toggle" onClick={() => toggle(folder.id)}>
          <ChevronRight className={isOpen ? "doc-tree-chevron is-open" : "doc-tree-chevron"} aria-hidden />
          <span className="doc-tree-name" title={folder.name}>
            {folder.name}
          </span>
        </button>
        {folder.href ? <FolderDriveIcon href={folder.href} /> : null}
      </div>
      {isOpen ? (
        <div role="group">
          {folder.children.map((child) =>
            child.kind === "folder" ? (
              <TreeFolder key={child.id} folder={child} depth={depth + 1} open={open} toggle={toggle} />
            ) : (
              <TreeFile key={child.id} file={child} depth={depth + 1} />
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Finder do deal. Começa fechado. A pasta abre no lugar; o arquivo é o nome. */
export function DocTree({ items, roomId }: { items: DriveDocument[]; roomId: string | null }) {
  const roots = useMemo(() => buildDocTree(items, roomId), [items, roomId]);
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  function toggle(id: string) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!roots.length) return <EmptyState compact title="Nenhum documento" />;

  return (
    <div className="doc-tree" role="tree" aria-label="Documentos">
      {roots.map((node) =>
        node.kind === "folder" ? (
          <TreeFolder key={node.id} folder={node} depth={0} open={open} toggle={toggle} />
        ) : (
          <TreeFile key={node.id} file={node} depth={0} />
        ),
      )}
    </div>
  );
}
