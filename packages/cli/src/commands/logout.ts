import { Command } from 'commander';
import { clearToken, isAuthenticated } from '../auth/token-store.js';
import { colors } from '../ui/colors.js';

export const logoutCommand = new Command('logout')
  .description('Log out of the agentx registry')
  .addHelpText('after', `
Examples:
  $ agentx logout`)
  .action(() => {
    try {
      if (!isAuthenticated()) {
        console.log(colors.info('Not currently logged in.'));
        return;
      }

      clearToken();
      console.log(colors.success('Logged out successfully.'));
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
