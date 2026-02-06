import * as p from '@clack/prompts';
import { saveSecrets, loadSecrets } from './store.js';
import type { SecretDeclaration } from '../types/agent.js';

export interface ConfigureOptions {
  agentName: string;
  declarations: SecretDeclaration[];
  secretsDir?: string;
}

export async function runConfigureFlow(options: ConfigureOptions): Promise<void> {
  const { agentName, declarations, secretsDir } = options;

  if (declarations.length === 0) {
    p.log.info('This agent does not require any secrets.');
    return;
  }

  p.intro(`Configure secrets for ${agentName}`);

  const existing = await loadSecrets(agentName, secretsDir);
  const secrets: Record<string, string> = { ...existing };

  for (const decl of declarations) {
    const currentValue = existing[decl.name];
    const label = decl.description
      ? `${decl.name} (${decl.description})`
      : decl.name;

    const hint = currentValue ? 'Press enter to keep existing value' : undefined;

    const value = await p.text({
      message: label,
      placeholder: hint,
      validate(input) {
        if (!input && !currentValue && decl.required !== false) {
          return 'This secret is required';
        }
      },
    });

    if (p.isCancel(value)) {
      p.cancel('Configuration cancelled.');
      process.exit(0);
    }

    if (value) {
      secrets[decl.name] = value;
    }
  }

  await saveSecrets(agentName, secrets, secretsDir);

  p.outro(`Secrets saved for ${agentName}`);
}
