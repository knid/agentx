import { Command } from 'commander';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { AGENTS_DIR } from '../config/paths.js';
import { deleteSecrets } from '../secrets/store.js';
import { colors } from '../ui/colors.js';

export const uninstallCommand = new Command('uninstall')
  .description('Uninstall an agent')
  .argument('<agent>', 'Agent name to uninstall')
  .option('--keep-secrets', 'Keep secrets (do not delete encrypted secrets)')
  .action(async (agentName: string, options: { keepSecrets?: boolean }) => {
    try {
      const agentDir = join(AGENTS_DIR, agentName);

      if (!existsSync(agentDir)) {
        console.error(
          colors.error(`Agent "${agentName}" is not installed.`),
        );
        process.exit(1);
      }

      // Remove agent directory
      rmSync(agentDir, { recursive: true, force: true });

      // Remove secrets unless --keep-secrets is passed
      if (!options.keepSecrets) {
        await deleteSecrets(agentName);
      }

      console.log(
        colors.success(`Uninstalled ${colors.bold(agentName)}`),
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
