import { Command } from 'commander';
import { searchAgents } from '../registry/search.js';
import { formatTable } from '../ui/table.js';
import { colors } from '../ui/colors.js';

export const searchCommand = new Command('search')
  .description('Search for agents in the registry')
  .argument('<query>', 'Search query')
  .option('-l, --limit <n>', 'Maximum results to display', '20')
  .option('-c, --category <category>', 'Filter by category')
  .option('-s, --sort <sort>', 'Sort order: downloads, stars, newest', 'downloads')
  .option('--json', 'Output as JSON')
  .action(
    async (
      query: string,
      options: { limit: string; category?: string; sort?: string; json?: boolean },
    ) => {
      try {
        const limit = parseInt(options.limit, 10) || 20;

        const response = await searchAgents(query, {
          limit,
          category: options.category,
          sort: options.sort,
        });

        if (options.json) {
          console.log(JSON.stringify(response, null, 2));
          return;
        }

        if (response.agents.length === 0) {
          console.log(colors.dim(`  No agents found for "${query}".`));
          return;
        }

        console.log();
        console.log(
          `  Found ${colors.bold(String(response.total))} agent${response.total === 1 ? '' : 's'} matching "${query}"`,
        );
        console.log();

        const table = formatTable(
          [
            { key: 'name', label: 'Name', width: 30 },
            { key: 'description', label: 'Description', width: 40 },
            { key: 'version', label: 'Version', width: 10 },
            { key: 'downloads', label: 'DL', width: 8, align: 'right' },
            { key: 'stars', label: 'Stars', width: 6, align: 'right' },
          ],
          response.agents.map((a) => ({
            name: `${a.scope}/${a.name}`,
            description: a.description,
            version: a.latest_version,
            downloads: String(a.download_count),
            stars: String(a.star_count),
          })),
        );

        console.log(
          table
            .split('\n')
            .map((line) => `  ${line}`)
            .join('\n'),
        );
        console.log();
      } catch (error) {
        if (error instanceof Error) {
          console.error(colors.error(`Error: ${error.message}`));
        }
        process.exit(1);
      }
    },
  );
