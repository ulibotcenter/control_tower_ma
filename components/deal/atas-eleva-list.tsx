import { DriveLink } from "@/components/ui/drive-link";
import { atasEleva } from "@/lib/data/atas-eleva";
import type { DriveDocument } from "@/lib/types";

/** Nome e link. O corpo do arquivo não entra neste bloco. */
export function AtasElevaList({
  items,
  roomId,
}: {
  items: DriveDocument[];
  roomId: string | null;
}) {
  const files = atasEleva(items, roomId);
  return (
    <div className="mt-10">
      <h3 className="serif mb-3 text-xl text-navy">Atas Eleva</h3>
      {files.length === 0 ? null : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file.id} className="paper flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
              <span className="font-semibold text-navy">{file.name}</span>
              {file.href ? <DriveLink href={file.href}>Drive</DriveLink> : <span className="text-muted">—</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
