import { Command } from 'commander';
import { fetchAgentInfo } from '../registry/download.js';
import { colors } from '../ui/colors.js';

/**
 * Parse an agent specifier like `@scope/name` or bare `name`.
 */
function parseInfoSpecifier(spec: string): { scope: string; name: string } {
  const slashIndex = spec.indexOf('/');
  if (slashIndex > 0) {
    return {
      scope: spec.slice(0, slashIndex),
      name: spec.slice(slashIndex + 1),
    };
  }
  return { scope: '@agentx', name: spec };
}

export const infoCommand = new Command('info')
  .description('Display agent details from the registry')
  .argument('<agent>', 'Agent to look up (e.g. @scope/name)')
  .option('--json', 'Output as JSON')
  .addHelpText('after', `
Examples:
  $ agentx info @agentx/data-analyst
  $ agentx info @agentx/gmail-agent --json`)
  .action(async (agentSpec: string, options: { json?: boolean }) => {
    try {
      const { scope, name } = parseInfoSpecifier(agentSpec);

      const info = await fetchAgentInfo(scope, name);

      if (options.json) {
        console.log(JSON.stringify(info, null, 2));
        return;
      }

      console.log();
      console.log(`  ${colors.bold(`${info.scope}/${info.name}`)} v${info.latest_version}`);
      console.log(`  ${colors.dim(info.description ?? '')}`);
      console.log();

      if (info.author) {
        console.log(`  ${colors.dim('Author:')}    ${info.author.username}`);
      }
      if (info.category) {
        console.log(`  ${colors.dim('Category:')}  ${info.category}`);
      }
      if (info.license) {
        console.log(`  ${colors.dim('License:')}   ${info.license}`);
      }
      if (info.tags && info.tags.length > 0) {
        console.log(`  ${colors.dim('Tags:')}      ${info.tags.join(', ')}`);
      }

      console.log();
      console.log(`  ${colors.dim('Downloads:')} ${info.download_count}`);
      console.log(`  ${colors.dim('Stars:')}     ${info.star_count}`);
      if (info.is_verified) {
        console.log(`  ${colors.success('Verified')}`);
      }

      if (info.repository) {
        console.log(`  ${colors.dim('Repository:')} ${colors.cyan(info.repository)}`);
      }
      if (info.homepage) {
        console.log(`  ${colors.dim('Homepage:')}   ${colors.cyan(info.homepage)}`);
      }

      console.log();
      console.log(
        `  ${colors.dim('Install:')} ${colors.cyan(`agentx install ${scope}/${name}`)}`,
      );

      if ((info as any).versions && Array.isArray((info as any).versions)) {
        console.log();
        console.log(`  ${colors.dim('Versions:')}`);
        for (const v of (info as any).versions) {
          console.log(`    ${v.version}  ${colors.dim(v.published_at ?? '')}`);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
