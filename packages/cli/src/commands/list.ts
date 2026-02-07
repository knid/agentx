import { Command } from 'commander';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { AGENTS_DIR } from '../config/paths.js';
import { loadAgentYaml } from '../config/agent-config.js';
import { formatTable } from '../ui/table.js';
import { colors } from '../ui/colors.js';

export const listCommand = new Command('list')
  .alias('ls')
  .description('List installed agents')
  .option('--json', 'Output as JSON')
  .addHelpText('after', `
Examples:
  $ agentx list
  $ agentx ls --json`)
  .action((options: { json?: boolean }) => {
    try {
      if (!existsSync(AGENTS_DIR)) {
        if (options.json) {
          console.log(JSON.stringify([]));
        } else {
          console.log(colors.dim('No agents installed.'));
          console.log(
            colors.dim(`Run ${colors.cyan('agentx install @scope/agent-name')} to install one.`),
          );
        }
        return;
      }

      const entries = readdirSync(AGENTS_DIR, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .filter((e) => existsSync(join(AGENTS_DIR, e.name, 'agent.yaml')));

      if (entries.length === 0) {
        if (options.json) {
          console.log(JSON.stringify([]));
        } else {
          console.log(colors.dim('No agents installed.'));
          console.log(
            colors.dim(`Run ${colors.cyan('agentx install @scope/agent-name')} to install one.`),
          );
        }
        return;
      }

      const agentData = entries.map((entry) => {
        const agentDir = join(AGENTS_DIR, entry.name);
        try {
          const manifest = loadAgentYaml(agentDir);
          return {
            name: manifest.name,
            version: manifest.version,
            author: manifest.author,
            description: manifest.description,
            category: manifest.category ?? '',
          };
        } catch {
          return {
            name: entry.name,
            version: '?',
            author: '?',
            description: 'Error reading agent.yaml',
            category: '',
          };
        }
      });

      if (options.json) {
        console.log(JSON.stringify(agentData, null, 2));
        return;
      }

      console.log(colors.bold(`Installed agents (${agentData.length}):\n`));

      const table = formatTable(
        [
          { key: 'name', label: 'Name', width: 25 },
          { key: 'version', label: 'Version', width: 10 },
          { key: 'author', label: 'Author', width: 20 },
          { key: 'description', label: 'Description', width: 40 },
        ],
        agentData,
      );

      console.log(table);
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
