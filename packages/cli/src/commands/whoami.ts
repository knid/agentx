import { Command } from 'commander';
import { loadToken } from '../auth/token-store.js';
import { colors } from '../ui/colors.js';

export const whoamiCommand = new Command('whoami')
  .description('Display the currently authenticated user')
  .addHelpText('after', `
Examples:
  $ agentx whoami`)
  .action(() => {
    try {
      const token = loadToken();

      if (!token) {
        console.log(colors.warn('Not logged in. Run "agentx login" to authenticate.'));
        return;
      }

      console.log(colors.bold(token.username));
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
