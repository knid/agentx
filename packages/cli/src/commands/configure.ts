import { Command } from 'commander';
import { loadAgentYaml, getAgentDir } from '../config/agent-config.js';
import { runConfigureFlow } from '../secrets/configure-flow.js';
import { colors } from '../ui/colors.js';

export const configureCommand = new Command('configure')
  .description('Configure secrets for an agent')
  .argument('<agent>', 'Agent name or path')
  .action(async (agent: string) => {
    try {
      const agentDir = getAgentDir(agent);
      const manifest = loadAgentYaml(agentDir);

      if (!manifest.secrets || manifest.secrets.length === 0) {
        console.log(colors.info(`Agent "${manifest.name}" does not declare any secrets.`));
        return;
      }

      await runConfigureFlow({
        agentName: manifest.name,
        declarations: manifest.secrets,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
