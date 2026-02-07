import { Command } from 'commander';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { AGENTS_DIR } from '../config/paths.js';
import { loadAgentYaml } from '../config/agent-config.js';
import { fetchAgentInfo, installAgent } from '../registry/download.js';
import { isNewerThan } from '../utils/semver.js';
import { createSpinner } from '../ui/spinner.js';
import { colors } from '../ui/colors.js';

export const updateCommand = new Command('update')
  .description('Update installed agents to the latest version')
  .argument('[agent]', 'Specific agent to update')
  .option('--all', 'Update all installed agents')
  .addHelpText('after', `
Examples:
  $ agentx update data-analyst
  $ agentx update --all`)
  .action(async (agentName?: string, options?: { all?: boolean }) => {
    try {
      if (!agentName && !options?.all) {
        console.error(
          colors.error('Specify an agent name or use --all to update all agents.'),
        );
        process.exit(1);
      }

      const agentsToUpdate: string[] = [];

      if (options?.all) {
        if (!existsSync(AGENTS_DIR)) {
          console.log(colors.dim('No agents installed.'));
          return;
        }
        const entries = readdirSync(AGENTS_DIR, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .filter((e) => existsSync(join(AGENTS_DIR, e.name, 'agent.yaml')));
        agentsToUpdate.push(...entries.map((e) => e.name));
      } else if (agentName) {
        agentsToUpdate.push(agentName);
      }

      if (agentsToUpdate.length === 0) {
        console.log(colors.dim('No agents to update.'));
        return;
      }

      let updatedCount = 0;

      for (const name of agentsToUpdate) {
        const agentDir = join(AGENTS_DIR, name);
        if (!existsSync(agentDir)) {
          console.log(colors.warn(`Agent "${name}" is not installed. Skipping.`));
          continue;
        }

        const manifest = loadAgentYaml(agentDir);
        const scope = manifest.author;

        const spin = createSpinner();
        spin.start(`Checking ${colors.bold(name)} for updates...`);

        try {
          const info = await fetchAgentInfo(scope, name);

          if (!info.latest_version || !isNewerThan(info.latest_version, manifest.version)) {
            spin.stop(colors.dim(`${name} v${manifest.version} is already up to date`));
            continue;
          }

          spin.message(`Updating ${name} from v${manifest.version} to v${info.latest_version}...`);

          await installAgent(scope, name, info.latest_version);

          spin.stop(
            colors.success(
              `Updated ${colors.bold(name)} from v${manifest.version} to v${info.latest_version}`,
            ),
          );
          updatedCount++;
        } catch (error) {
          spin.stop(
            colors.error(
              `Failed to update ${name}: ${(error as Error).message}`,
            ),
          );
        }
      }

      console.log();
      if (updatedCount > 0) {
        console.log(colors.success(`Updated ${updatedCount} agent${updatedCount !== 1 ? 's' : ''}.`));
      } else {
        console.log(colors.dim('All agents are up to date.'));
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
