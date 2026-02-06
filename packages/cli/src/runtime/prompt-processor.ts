import type { ConfigOption } from '../types/agent.js';

/**
 * Process a system prompt template by replacing {{config.key}} placeholders
 * with values from config options or overrides.
 *
 * Resolution order: overrides > config option defaults > empty string
 */
export function processSystemPrompt(
  template: string,
  configOptions: Array<{ key: string; default?: string }>,
  overrides: Record<string, string>,
): string {
  return template.replace(/\{\{config\.(\w+)\}\}/g, (_match, key: string) => {
    if (key in overrides) {
      return overrides[key];
    }

    const option = configOptions.find((opt) => opt.key === key);
    if (option?.default !== undefined) {
      return option.default;
    }

    return '';
  });
}
