import { colors } from './colors.js';

export interface TableColumn {
  key: string;
  label: string;
  width?: number;
  align?: 'left' | 'right';
}

export function formatTable(columns: TableColumn[], rows: Record<string, string>[]): string {
  const widths = columns.map((col) => {
    const maxContent = Math.max(col.label.length, ...rows.map((r) => (r[col.key] || '').length));
    return col.width ?? Math.min(maxContent, 40);
  });

  const header = columns
    .map((col, i) => colors.bold(col.label.padEnd(widths[i])))
    .join('  ');

  const separator = widths.map((w) => '─'.repeat(w)).join('──');

  const body = rows
    .map((row) =>
      columns
        .map((col, i) => {
          const value = row[col.key] || '';
          const truncated = value.length > widths[i] ? value.slice(0, widths[i] - 1) + '…' : value;
          return col.align === 'right'
            ? truncated.padStart(widths[i])
            : truncated.padEnd(widths[i]);
        })
        .join('  '),
    )
    .join('\n');

  return `${header}\n${separator}\n${body}`;
}
