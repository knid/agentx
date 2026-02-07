import { Command } from 'commander';
import { loadGlobalConfig, saveGlobalConfig, getConfigValue, setConfigValue } from '../config/global-config.js';
import { globalConfigSchema } from '../schemas/config.js';
import { CONFIG_PATH } from '../config/paths.js';
import { colors } from '../ui/colors.js';
import { stringify } from 'yaml';

const VALID_KEYS = Object.keys(globalConfigSchema.shape) as Array<string>;

function formatValue(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

function parseValue(key: string, raw: string): unknown {
  // Boolean fields
  if (key === 'telemetry' || key === 'auto_update') {
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    throw new Error(`Value for "${key}" must be "true" or "false"`);
  }

  // Enum fields
  if (key === 'default_output') {
    if (raw === 'text' || raw === 'json') return raw;
    throw new Error(`Value for "${key}" must be "text" or "json"`);
  }

  // Nested object fields
  if (key === 'claude_defaults') {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(`Value for "${key}" must be valid JSON`);
    }
  }

  // String fields (registry, claude_path)
  return raw;
}

export const configCommand = new Command('config')
  .description('Manage global agentx configuration')
  .addHelpText('after', `
Examples:
  $ agentx config list              Show all config values
  $ agentx config get registry      Get a specific value
  $ agentx config set telemetry false  Set a config value
  $ agentx config path              Show config file path
  $ agentx config reset             Reset to defaults`);

configCommand
  .command('list')
  .description('Show all configuration values')
  .option('--json', 'Output as JSON')
  .action((options: { json?: boolean }) => {
    try {
      const config = loadGlobalConfig();
      if (options.json) {
        console.log(JSON.stringify(config, null, 2));
      } else {
        console.log(colors.bold('agentx configuration:\n'));
        for (const [key, value] of Object.entries(config)) {
          console.log(`  ${colors.cyan(key)}: ${formatValue(value)}`);
        }
        console.log(`\n  ${colors.dim(`Config file: ${CONFIG_PATH}`)}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });

configCommand
  .command('get')
  .description('Get a configuration value')
  .argument('<key>', `Config key (${VALID_KEYS.join(', ')})`)
  .action((key: string) => {
    try {
      if (!VALID_KEYS.includes(key)) {
        console.error(colors.error(`Unknown config key: "${key}"`));
        console.error(colors.dim(`Valid keys: ${VALID_KEYS.join(', ')}`));
        process.exit(1);
      }

      const value = getConfigValue(key as keyof ReturnType<typeof loadGlobalConfig>);
      console.log(formatValue(value));
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });

configCommand
  .command('set')
  .description('Set a configuration value')
  .argument('<key>', `Config key (${VALID_KEYS.join(', ')})`)
  .argument('<value>', 'Value to set')
  .action((key: string, raw: string) => {
    try {
      if (!VALID_KEYS.includes(key)) {
        console.error(colors.error(`Unknown config key: "${key}"`));
        console.error(colors.dim(`Valid keys: ${VALID_KEYS.join(', ')}`));
        process.exit(1);
      }

      const value = parseValue(key, raw);
      setConfigValue(key as keyof ReturnType<typeof loadGlobalConfig>, value as never);
      console.log(colors.success(`Set ${colors.cyan(key)} = ${formatValue(value)}`));
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });

configCommand
  .command('path')
  .description('Show the config file path')
  .action(() => {
    console.log(CONFIG_PATH);
  });

configCommand
  .command('reset')
  .description('Reset configuration to defaults')
  .action(() => {
    try {
      const defaults = globalConfigSchema.parse({});
      saveGlobalConfig(defaults);
      console.log(colors.success('Configuration reset to defaults.'));
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
