import * as tar from 'tar';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { hashBuffer } from './hash.js';

/**
 * Files and directories to include in the agent tarball.
 * Only these entries are packed; everything else is excluded.
 */
const INCLUDE_ENTRIES = [
  'agent.yaml',
  'system-prompt.md',
  'README.md',
  'LICENSE',
  'prompts',
  'tools',
];

/**
 * Create a gzipped tarball from an agent directory.
 *
 * Only includes the standard agent files: agent.yaml, system-prompt.md,
 * README.md, LICENSE, prompts/**, and tools/**.
 *
 * @param agentDir - Absolute path to the agent directory.
 * @returns The tarball buffer and its SHA-256 hash.
 */
export async function createTarball(
  agentDir: string,
): Promise<{ buffer: Buffer; sha256: string }> {
  // Filter to only entries that actually exist in the agent directory.
  const entries = INCLUDE_ENTRIES.filter((entry) => {
    const fullPath = join(agentDir, entry);
    return existsSync(fullPath);
  });

  if (entries.length === 0) {
    throw new Error(`No packable files found in ${agentDir}`);
  }

  // Collect all chunks into a buffer.
  const chunks: Buffer[] = [];

  const stream = tar.create(
    {
      gzip: true,
      cwd: agentDir,
      portable: true,
    },
    entries,
  );

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk as Uint8Array));
  }

  const buffer = Buffer.concat(chunks);
  const sha256 = hashBuffer(buffer);

  return { buffer, sha256 };
}
