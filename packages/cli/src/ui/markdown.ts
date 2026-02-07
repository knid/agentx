import { marked, type Tokens } from 'marked';
import { markedTerminal } from 'marked-terminal';
import chalk from 'chalk';

marked.use(
  markedTerminal({
    firstHeading: chalk.magenta.bold,
    heading: chalk.magenta.bold,
    strong: chalk.bold,
    em: chalk.italic,
    codespan: chalk.yellow,
    code: chalk.yellow,
    blockquote: chalk.gray.italic,
    link: chalk.cyan,
    href: chalk.cyan.underline,
    del: chalk.dim.strikethrough,
    reflowText: true,
    width: Math.min(process.stdout.columns || 80, 100),
    showSectionPrefix: false,
    tab: 2,
  }),
);

// Fix marked-terminal bug: the `text` renderer grabs raw text instead of
// recursively parsing inline tokens (bold, code, etc.) inside list items.
marked.use({
  renderer: {
    text(token: string | Tokens.Text | Tokens.Escape) {
      if (typeof token === 'object' && 'tokens' in token && token.tokens) {
        return (this as unknown as { parser: { parseInline: (tokens: Tokens.Generic[]) => string } }).parser.parseInline(token.tokens);
      }
      return typeof token === 'object' ? token.text : token;
    },
  },
});

/**
 * Render a markdown string for terminal display.
 */
export function renderMarkdown(text: string): string {
  return marked.parse(text) as string;
}
