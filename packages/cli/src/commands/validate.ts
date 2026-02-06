import { Command } from 'commander';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { agentYamlSchema } from '../schemas/agent-yaml.js';
import { colors } from '../ui/colors.js';
import type { ZodError } from 'zod';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateAgentDir(agentDir: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const yamlPath = join(agentDir, 'agent.yaml');
  if (!existsSync(yamlPath)) {
    errors.push('agent.yaml not found');
    return { valid: false, errors, warnings };
  }

  try {
    const raw = readFileSync(yamlPath, 'utf-8');
    const parsed = parse(raw);
    agentYamlSchema.parse(parsed);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as unknown as ZodError;
      for (const issue of zodError.issues) {
        errors.push(`agent.yaml: ${issue.path.join('.')}: ${issue.message}`);
      }
    } else if (error instanceof Error) {
      errors.push(`agent.yaml: ${error.message}`);
    }
  }

  const promptPath = join(agentDir, 'system-prompt.md');
  if (!existsSync(promptPath)) {
    errors.push('system-prompt.md not found');
  }

  const readmePath = join(agentDir, 'README.md');
  if (!existsSync(readmePath)) {
    warnings.push('README.md not found (recommended)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export const validateCommand = new Command('validate')
  .description('Validate an agent project')
  .argument('[directory]', 'Agent directory to validate', '.')
  .action(async (directory: string) => {
    const agentDir = resolve(directory);
    const result = validateAgentDir(agentDir);

    if (result.valid) {
      console.log(colors.success('  Agent is valid!'));
    } else {
      console.log(colors.error('  Validation failed:'));
      for (const error of result.errors) {
        console.log(colors.error(`    ${error}`));
      }
    }

    for (const warning of result.warnings) {
      console.log(colors.warn(`    ${warning}`));
    }

    if (!result.valid) {
      process.exit(1);
    }
  });
