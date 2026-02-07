import { colors } from '../ui/colors.js';
import { renderMarkdown } from '../ui/markdown.js';

const SEPARATOR = '─'.repeat(40);

export interface RunHeaderOptions {
  agentName: string;
  version: string;
}

export interface RunOutputOptions {
  format: 'text' | 'json';
}

export interface RunFooterOptions {
  durationMs: number;
}

/**
 * Print a styled header before agent output.
 */
export function printRunHeader(opts: RunHeaderOptions): void {
  console.log();
  console.log(`  ${colors.magenta('▶')} ${colors.bold(opts.agentName)} ${colors.dim(`v${opts.version}`)}`);
  console.log(`  ${colors.dim(SEPARATOR)}`);
  console.log();
}

/**
 * Render and print agent output (markdown or JSON).
 */
export function printRunOutput(raw: string, opts: RunOutputOptions): void {
  const trimmed = raw.trim();
  if (!trimmed) return;

  if (opts.format === 'json') {
    try {
      const parsed = JSON.parse(trimmed);
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      console.log(trimmed);
    }
    return;
  }

  const rendered = renderMarkdown(trimmed);
  // Indent each line by 2 spaces for visual nesting under the header
  const indented = rendered
    .replace(/\n$/, '')
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
  console.log(indented);
}

/**
 * Print a styled footer after agent output.
 */
export function printRunFooter(opts: RunFooterOptions): void {
  const seconds = (opts.durationMs / 1000).toFixed(1);
  console.log();
  console.log(`  ${colors.dim(SEPARATOR)}`);
  console.log(`  ${colors.success('✓')} ${colors.dim(`Completed in ${seconds}s`)}`);
  console.log();
}

/**
 * Format agent output based on the requested format.
 * @deprecated Use printRunOutput instead.
 */
export function formatOutput(data: string, format: 'text' | 'json'): string {
  if (format === 'json') {
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return JSON.stringify({ output: data });
    }
  }
  return data;
}
