import { Command } from 'commander';
import { runAgent } from '../runtime/runner.js';
import { colors } from '../ui/colors.js';

export const runCommand = new Command('run')
  .description('Run a local or installed agent')
  .argument('<agent>', 'Agent name, path, or "." for current directory')
  .argument('[prompt...]', 'Prompt to send to the agent')
  .option('-i, --interactive', 'Run in interactive mode (stdin/stdout)')
  .option('--file <path>', 'Include file content in the prompt')
  .option('--json', 'Output in JSON format')
  .option('--quiet', 'Suppress output (useful for scripting)')
  .option('--debug', 'Show debug information')
  .option('--output-format <format>', 'Output format: text or json', 'text')
  .addHelpText('after', `
Examples:
  $ agentx run data-analyst "summarize this data" --file data.csv
  $ agentx run . "test prompt"
  $ cat report.csv | agentx run data-analyst "find anomalies"
  $ agentx run gmail-agent -i`)
  .action(async (agent: string, promptParts: string[], options) => {
    try {
      const prompt = promptParts.join(' ');
      const outputFormat = options.json ? 'json' : (options.outputFormat as 'text' | 'json');

      await runAgent(agent, {
        prompt: prompt || undefined,
        interactive: options.interactive ?? (!prompt && !options.file),
        file: options.file,
        outputFormat,
        quiet: options.quiet,
        debug: options.debug,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
        if (options.debug && error.stack) {
          console.error(colors.dim(error.stack));
        }
      }
      process.exit(1);
    }
  });
