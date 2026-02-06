import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { agentYamlSchema } from '../schemas/agent-yaml.js';
import { AGENTS_DIR } from './paths.js';
import { AgentNotFoundError, ValidationError } from '../utils/errors.js';
import type { AgentManifest, AgentConfig } from '../types/agent.js';

export function getAgentDir(agentName: string): string {
  // Support running from a local directory (. or absolute/relative path)
  if (agentName === '.' || agentName.startsWith('/') || agentName.startsWith('./')) {
    return resolve(agentName);
  }
  return join(AGENTS_DIR, agentName);
}

export function loadAgentYaml(agentDir: string): AgentManifest {
  const yamlPath = join(agentDir, 'agent.yaml');

  if (!existsSync(yamlPath)) {
    throw new AgentNotFoundError(agentDir);
  }

  try {
    const raw = readFileSync(yamlPath, 'utf-8');
    const parsed = parse(raw);
    return agentYamlSchema.parse(parsed) as AgentManifest;
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      throw new ValidationError(`Invalid agent.yaml in ${agentDir}`, [error.message]);
    }
    throw error;
  }
}

export function loadSystemPrompt(agentDir: string): string {
  const promptPath = join(agentDir, 'system-prompt.md');

  if (!existsSync(promptPath)) {
    throw new ValidationError(`Missing system-prompt.md in ${agentDir}`);
  }

  return readFileSync(promptPath, 'utf-8');
}

export function loadAgentConfig(agentName: string): AgentConfig {
  const agentDir = getAgentDir(agentName);
  const manifest = loadAgentYaml(agentDir);
  const systemPrompt = loadSystemPrompt(agentDir);

  return {
    manifest,
    systemPrompt,
    agentDir,
  };
}
