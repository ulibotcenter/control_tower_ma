/** Itens do Pedir leitura mais recente: o mesmo created_at nas ondas daquele clique. */
export function latestReadingAt(rows: { createdAt: string }[]) {
  return rows.reduce((max, row) => (row.createdAt > max ? row.createdAt : max), "");
}

export function inLatestReading<T extends { createdAt: string }>(rows: T[]) {
  const at = latestReadingAt(rows);
  return at ? rows.filter((row) => row.createdAt === at) : [];
}
