/** Export an array of records to a CSV file (client-side download). */
export function exportToCsv<T extends object>(
  filename: string,
  rows: T[],
  columns?: { key: keyof T; header: string }[]
) {
  if (rows.length === 0) return;
  const cols =
    columns ?? (Object.keys(rows[0] as object).map((k) => ({ key: k as keyof T, header: k })));
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.map((c) => escape(c.header)).join(",");
  const body = rows
    .map((row) => cols.map((c) => escape((row as T)[c.key])).join(","))
    .join("\n");
  const csv = `${header}\n${body}`;
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
