export function toCsv(
  headers: string[],
  rows: Array<Record<string, string | number | boolean | null | undefined>>
) {
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        const text = value == null ? "" : String(value);
        const escaped = text.replace(/"/g, "\"\"");
        return `"${escaped}"`;
      })
      .join(",")
  );

  return [headerLine, ...dataLines].join("\n");
}
