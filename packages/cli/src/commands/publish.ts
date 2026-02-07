import { Command } from 'commander';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadToken } from '../auth/token-store.js';
import { loadAgentYaml } from '../config/agent-config.js';
import { publishAgent } from '../registry/publish.js';
import { createSpinner } from '../ui/spinner.js';
import { colors } from '../ui/colors.js';

export const publishCommand = new Command('publish')
  .description('Publish an agent to the agentx registry')
  .argument('[directory]', 'Agent directory to publish', '.')
  .addHelpText('after', `
Examples:
  $ agentx publish
  $ agentx publish ./my-agent`)
  .action(async (directory: string) => {
    try {
      const agentDir = resolve(directory);

      // Validate the directory contains an agent.yaml.
      const yamlPath = join(agentDir, 'agent.yaml');
      if (!existsSync(yamlPath)) {
        console.error(
          colors.error(`No agent.yaml found in ${agentDir}. Run "agentx init" to create one.`),
        );
        process.exit(1);
      }

      // Validate the agent manifest loads correctly.
      const manifest = loadAgentYaml(agentDir);

      // Check authentication.
      const token = loadToken();
      if (!token) {
        console.error(
          colors.error('Not logged in. Run "agentx login" to authenticate first.'),
        );
        process.exit(1);
      }

      console.log(
        colors.info(
          `Publishing ${colors.bold(`${manifest.author}/${manifest.name}`)} v${manifest.version}...`,
        ),
      );

      const spin = createSpinner();
      spin.start('Packaging and uploading agent...');

      const result = await publishAgent(agentDir, token.token);

      spin.stop(
        colors.success(
          `Published ${colors.bold(result.full_name)} v${result.version}`,
        ),
      );

      console.log();
      console.log(`  ${colors.dim('View at:')} ${colors.cyan(result.url)}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
