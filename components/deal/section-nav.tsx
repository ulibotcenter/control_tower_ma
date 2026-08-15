"use client";

const ITEMS = [
  { id: "visao", label: "Visão" },
  { id: "tese", label: "Tese e preço" },
  { id: "checklist", label: "Checklist" },
  { id: "workstreams", label: "Workstreams" },
  { id: "riscos", label: "Riscos" },
  { id: "acoes", label: "Ações" },
  { id: "docs", label: "Documentos" },
  { id: "indicadores", label: "Indicadores" },
];

export function SectionNav({ hideThesis, hasThesis }: { hideThesis?: boolean; hasThesis?: boolean }) {
  const items = hideThesis || hasThesis === false ? ITEMS.filter((i) => i.id !== "tese") : ITEMS;
  return (
    <nav className="sticky top-0 z-20 -mx-4 mb-8 border-y border-line bg-cream/95 px-4 py-2 backdrop-blur">
      <ul className="flex gap-1 overflow-x-auto text-[13px]">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block whitespace-nowrap px-3 py-1.5 text-navy hover:bg-cream-2"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
