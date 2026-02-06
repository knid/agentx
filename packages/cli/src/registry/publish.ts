import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadAgentYaml } from '../config/agent-config.js';
import { createRegistryClient } from './client.js';
import { createTarball } from '../utils/tar.js';
import { ValidationError } from '../utils/errors.js';
import type { PublishResponse } from '../types/registry.js';

/**
 * Publish an agent to the agentx registry.
 *
 * Validates the agent directory, creates a tarball, reads the README,
 * and uploads everything to the registry via a multipart PUT request.
 *
 * @param agentDir - Absolute path to the agent directory containing agent.yaml.
 * @param token - Authentication token for the registry.
 * @returns The publish response from the registry.
 */
export async function publishAgent(
  agentDir: string,
  token: string,
): Promise<PublishResponse> {
  // Load and validate agent.yaml.
  const manifest = loadAgentYaml(agentDir);

  // Ensure the author field is present (required for scoped publishing).
  if (!manifest.author.startsWith('@')) {
    throw new ValidationError('Agent author must start with @ (e.g. @username)');
  }

  // The scope is the author without the @ prefix.
  const scope = manifest.author.slice(1);

  // Create the tarball.
  const { buffer, sha256 } = await createTarball(agentDir);

  // Read README.md if it exists.
  const readmePath = join(agentDir, 'README.md');
  const readme = existsSync(readmePath)
    ? readFileSync(readmePath, 'utf-8')
    : '';

  // Build the multipart form data.
  const formData = new FormData();
  formData.append(
    'tarball',
    new Blob([new Uint8Array(buffer)], { type: 'application/gzip' }),
    `${manifest.name}-${manifest.version}.tar.gz`,
  );
  formData.append('agent_yaml', JSON.stringify(manifest));
  formData.append('readme', readme);
  formData.append('sha256', sha256);

  // Upload to the registry.
  const client = createRegistryClient({ token });
  return client.put<PublishResponse>(
    `/agents/${scope}/${manifest.name}`,
    formData,
  );
}
