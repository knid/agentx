import { Command } from 'commander';
import { startOAuthFlow } from '../auth/github-oauth.js';
import { saveToken, isAuthenticated, loadToken } from '../auth/token-store.js';
import { loadGlobalConfig } from '../config/global-config.js';
import { createSpinner } from '../ui/spinner.js';
import { colors } from '../ui/colors.js';

export const loginCommand = new Command('login')
  .description('Authenticate with the agentx registry via GitHub')
  .action(async () => {
    try {
      // Check if already logged in.
      if (isAuthenticated()) {
        const existing = loadToken();
        if (existing) {
          console.log(
            colors.info(`Already logged in as ${colors.bold(existing.username)}.`),
          );
          console.log(colors.dim('Run "agentx logout" first to switch accounts.'));
          return;
        }
      }

      const config = loadGlobalConfig();
      const spin = createSpinner();

      console.log(colors.info('Opening GitHub in your browser to authenticate...'));
      spin.start('Waiting for authentication...');

      const token = await startOAuthFlow(config.registry);

      saveToken(token);
      spin.stop(colors.success(`Logged in as ${colors.bold(token.username)}`));
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
