import { Command } from 'commander';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { AGENTS_DIR, SCHEDULER_STATE, SCHEDULER_PID } from '../config/paths.js';
import { deleteSecrets } from '../secrets/store.js';
import { loadScheduleState, removeAgentFromState, saveScheduleState } from '../scheduler/state.js';
import { isDaemonRunning, signalDaemon, stopDaemon } from '../scheduler/process.js';
import { colors } from '../ui/colors.js';

export const uninstallCommand = new Command('uninstall')
  .description('Uninstall an agent')
  .argument('<agent>', 'Agent name to uninstall')
  .option('--keep-secrets', 'Keep secrets (do not delete encrypted secrets)')
  .addHelpText('after', `
Examples:
  $ agentx uninstall data-analyst
  $ agentx uninstall gmail-agent --keep-secrets`)
  .action(async (agentName: string, options: { keepSecrets?: boolean }) => {
    try {
      const agentDir = join(AGENTS_DIR, agentName);

      if (!existsSync(agentDir)) {
        console.error(
          colors.error(`Agent "${agentName}" is not installed.`),
        );
        process.exit(1);
      }

      // Stop schedule if active
      try {
        const state = await loadScheduleState(SCHEDULER_STATE);
        if (state.agents[agentName]) {
          const updated = removeAgentFromState(state, agentName);
          await saveScheduleState(updated, SCHEDULER_STATE);
          if (Object.keys(updated.agents).length === 0) {
            stopDaemon(SCHEDULER_PID);
          } else if (isDaemonRunning(SCHEDULER_PID)) {
            signalDaemon('SIGHUP', SCHEDULER_PID);
          }
          console.log(colors.dim(`Stopped schedule for ${agentName}`));
        }
      } catch {
        // Scheduler may not be initialized, that's fine
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
