import { Command } from 'commander';
import * as p from '@clack/prompts';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { VALID_CATEGORIES } from '../schemas/agent-yaml.js';
import { colors } from '../ui/colors.js';

function getTemplatesDir(): string {
  // Templates are relative to the package root (works in both source and dist)
  const packageRoot = resolve(new URL('..', import.meta.url).pathname);
  // Try source layout first (src/templates), then dist layout (templates)
  const srcPath = join(packageRoot, 'src', 'templates', 'basic');
  if (existsSync(srcPath)) return srcPath;
  return join(packageRoot, 'templates', 'basic');
}

function loadTemplate(templatesDir: string, filename: string): string {
  return readFileSync(join(templatesDir, filename), 'utf-8');
}

function replaceTemplateVars(content: string, vars: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

export const initCommand = new Command('init')
  .description('Scaffold a new agent project')
  .argument('[directory]', 'Directory to create the agent in', '.')
  .action(async (directory: string) => {
    try {
      p.intro('Create a new agentx agent');

      const name = await p.text({
        message: 'Agent name',
        placeholder: 'my-agent',
        validate(input) {
          if (!input) return 'Name is required';
          if (!/^[a-z0-9-]+$/.test(input)) {
            return 'Name must contain only lowercase letters, numbers, and hyphens';
          }
        },
      });
      if (p.isCancel(name)) { p.cancel('Init cancelled.'); process.exit(0); }

      const description = await p.text({
        message: 'Description',
        placeholder: 'A helpful AI agent',
        validate(input) {
          if (!input) return 'Description is required';
          if (input.length > 500) return 'Description must be 500 characters or less';
        },
      });
      if (p.isCancel(description)) { p.cancel('Init cancelled.'); process.exit(0); }

      const author = await p.text({
        message: 'Author (e.g. @username)',
        placeholder: '@username',
        validate(input) {
          if (!input) return 'Author is required';
          if (!input.startsWith('@')) return 'Author must start with @';
        },
      });
      if (p.isCancel(author)) { p.cancel('Init cancelled.'); process.exit(0); }

      const category = await p.select({
        message: 'Category',
        options: VALID_CATEGORIES.map((c) => ({ value: c, label: c })),
      });
      if (p.isCancel(category)) { p.cancel('Init cancelled.'); process.exit(0); }

      const license = await p.text({
        message: 'License',
        placeholder: 'MIT',
        initialValue: 'MIT',
      });
      if (p.isCancel(license)) { p.cancel('Init cancelled.'); process.exit(0); }

      const targetDir = directory === '.' ? resolve(name as string) : resolve(directory);

      if (existsSync(targetDir)) {
        const overwrite = await p.confirm({
          message: `Directory ${targetDir} already exists. Continue?`,
        });
        if (p.isCancel(overwrite) || !overwrite) {
          p.cancel('Init cancelled.');
          process.exit(0);
        }
      }

      mkdirSync(targetDir, { recursive: true });

      const vars: Record<string, string> = {
        NAME: name as string,
        DESCRIPTION: description as string,
        AUTHOR: author as string,
        CATEGORY: category as string,
        LICENSE: license as string,
        YEAR: new Date().getFullYear().toString(),
      };

      const templatesDir = getTemplatesDir();
      const templates = ['agent.yaml', 'system-prompt.md', 'README.md', 'LICENSE'];

      for (const file of templates) {
        const content = loadTemplate(templatesDir, file);
        const populated = replaceTemplateVars(content, vars);
        writeFileSync(join(targetDir, file), populated, 'utf-8');
      }

      p.outro(`Agent scaffolded at ${colors.cyan(targetDir)}`);
      console.log();
      console.log(`  Next steps:`);
      console.log(`  ${colors.dim('1.')} cd ${name}`);
      console.log(`  ${colors.dim('2.')} Edit system-prompt.md with your agent's instructions`);
      console.log(`  ${colors.dim('3.')} agentx validate`);
      console.log(`  ${colors.dim('4.')} agentx run . "test prompt"`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
