import { Command } from 'commander';
import { getTrending } from '../registry/search.js';
import { formatTable } from '../ui/table.js';
import { colors } from '../ui/colors.js';

export const trendingCommand = new Command('trending')
  .description('Show trending agents')
  .option('-p, --period <period>', 'Time period: day, week, month', 'week')
  .option('-l, --limit <n>', 'Maximum results to display', '20')
  .option('--json', 'Output as JSON')
  .addHelpText('after', `
Examples:
  $ agentx trending
  $ agentx trending --period month
  $ agentx trending --period day --limit 5`)
  .action(
    async (options: { period: string; limit: string; json?: boolean }) => {
      try {
        const limit = parseInt(options.limit, 10) || 20;

        const response = await getTrending({
          period: options.period,
          limit,
        });

        if (options.json) {
          console.log(JSON.stringify(response, null, 2));
          return;
        }

        if (response.agents.length === 0) {
          console.log(colors.dim('  No trending agents found.'));
          return;
        }

        const periodLabel =
          options.period === 'day'
            ? 'today'
            : options.period === 'month'
              ? 'this month'
              : 'this week';

        console.log();
        console.log(`  ${colors.bold('Trending agents')} ${colors.dim(periodLabel)}`);
        console.log();

        const table = formatTable(
          [
            { key: 'rank', label: '#', width: 4, align: 'right' },
            { key: 'name', label: 'Name', width: 30 },
            { key: 'description', label: 'Description', width: 40 },
            { key: 'downloads', label: 'DL', width: 8, align: 'right' },
            { key: 'stars', label: 'Stars', width: 6, align: 'right' },
          ],
          response.agents.map((a, i) => ({
            rank: String(i + 1),
            name: `${a.scope}/${a.name}`,
            description: a.description,
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
