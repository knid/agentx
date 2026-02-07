import { Command } from 'commander';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { execa } from 'execa';
import { agentYamlSchema } from '../schemas/agent-yaml.js';
import { validateAgentDir } from './validate.js';
import { colors } from '../ui/colors.js';

async function checkMCPServerStartability(
  servers: Record<string, { command: string; args?: string[] }>,
): Promise<{ name: string; reachable: boolean; error?: string }[]> {
  const results: { name: string; reachable: boolean; error?: string }[] = [];

  for (const [name, server] of Object.entries(servers)) {
    try {
      await execa('which', [server.command]);
      results.push({ name, reachable: true });
    } catch {
      results.push({
        name,
        reachable: false,
        error: `Command "${server.command}" not found in PATH`,
      });
    }
  }

  return results;
}

export const testCommand = new Command('test')
  .description('Validate and test an agent project')
  .argument('[directory]', 'Agent directory to test', '.')
  .addHelpText('after', `
Examples:
  $ agentx test
  $ agentx test ./my-agent`)
  .action(async (directory: string) => {
    const agentDir = resolve(directory);

    // Step 1: Validate
    console.log(colors.bold('Running validation...'));
    const validation = validateAgentDir(agentDir);

    if (validation.valid) {
      console.log(colors.success('  Validation passed'));
    } else {
      console.log(colors.error('  Validation failed:'));
      for (const error of validation.errors) {
        console.log(colors.error(`    ${error}`));
      }
      process.exit(1);
    }

    for (const warning of validation.warnings) {
      console.log(colors.warn(`    ${warning}`));
    }

    // Step 2: Check MCP server commands
    const yamlPath = join(agentDir, 'agent.yaml');
    if (existsSync(yamlPath)) {
      try {
        const raw = readFileSync(yamlPath, 'utf-8');
        const parsed = parse(raw);
        const manifest = agentYamlSchema.parse(parsed);

        if (manifest.mcp_servers && Object.keys(manifest.mcp_servers).length > 0) {
          console.log(colors.bold('\nChecking MCP servers...'));
          const mcpResults = await checkMCPServerStartability(manifest.mcp_servers);

          for (const result of mcpResults) {
            if (result.reachable) {
              console.log(colors.success(`  ${result.name}: command found`));
            } else {
              console.log(colors.warn(`  ${result.name}: ${result.error}`));
            }
          }
        }
      } catch {
        // Already validated above, skip parse errors here
      }
    }

    console.log(colors.success('\n  All tests passed!'));
  });
