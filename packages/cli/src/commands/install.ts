import { Command } from 'commander';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { installAgent } from '../registry/download.js';
import { loadAgentYaml } from '../config/agent-config.js';
import { AGENTS_DIR } from '../config/paths.js';
import { createSpinner } from '../ui/spinner.js';
import { colors } from '../ui/colors.js';

/**
 * Parse an agent specifier like `@scope/name@version` or `@scope/name`.
 */
function parseAgentSpecifier(spec: string): {
  scope: string;
  name: string;
  version?: string;
} {
  // Handle @scope/name@version
  const atVersionIndex = spec.lastIndexOf('@');
  // If the only @ is at position 0, there's no version suffix
  if (atVersionIndex > 0) {
    const beforeVersion = spec.slice(0, atVersionIndex);
    const version = spec.slice(atVersionIndex + 1);
    const slashIndex = beforeVersion.indexOf('/');
    if (slashIndex > 0) {
      return {
        scope: beforeVersion.slice(0, slashIndex),
        name: beforeVersion.slice(slashIndex + 1),
        version,
      };
    }
  }

  // Handle @scope/name (no version)
  const slashIndex = spec.indexOf('/');
  if (slashIndex > 0) {
    return {
      scope: spec.slice(0, slashIndex),
      name: spec.slice(slashIndex + 1),
    };
  }

  // Bare name - assume default scope
  return { scope: '@agentx', name: spec };
}

export const installCommand = new Command('install')
  .description('Install an agent from the registry')
  .argument('<agent>', 'Agent to install (e.g. @scope/name or @scope/name@version)')
  .option('-f, --force', 'Force reinstall even if already installed')
  .action(async (agentSpec: string, options: { force?: boolean }) => {
    try {
      const { scope, name, version } = parseAgentSpecifier(agentSpec);
      const displayName = `${scope}/${name}`;
      const agentDir = join(AGENTS_DIR, name);

      // Check if already installed
      if (existsSync(agentDir) && !options.force) {
        const existing = loadAgentYaml(agentDir);
        console.log(
          colors.warn(
            `${displayName} v${existing.version} is already installed. Use --force to reinstall.`,
          ),
        );
        return;
      }

      console.log(
        colors.info(
          `Installing ${colors.bold(displayName)}${version ? ` v${version}` : ''}...`,
        ),
      );

      const spin = createSpinner();
      spin.start('Downloading and extracting agent...');

      const result = await installAgent(scope, name, version);

      spin.stop(
        colors.success(
          `Installed ${colors.bold(`${result.scope}/${result.name}`)} v${result.version}`,
        ),
      );

      // Check if the agent requires secrets
      const manifest = loadAgentYaml(result.agentDir);
      if (manifest.secrets && manifest.secrets.length > 0) {
        console.log();
        console.log(
          colors.warn(
            `This agent requires secrets. Run ${colors.bold(`agentx configure ${name}`)} to set them up.`,
          ),
        );
      }

      console.log();
      console.log(
        `  ${colors.dim('Run with:')} ${colors.cyan(`agentx run ${name} "your prompt"`)}`,
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
