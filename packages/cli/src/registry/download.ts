import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import * as tar from 'tar';
import { AGENTS_DIR } from '../config/paths.js';
import { createRegistryClient } from './client.js';
import { RegistryError } from '../utils/errors.js';
import type { AgentInfo } from '../types/registry.js';

/**
 * Response from the download endpoint with tarball metadata.
 */
interface DownloadInfo {
  tarball_url: string;
  tarball_sha256: string;
  version: string;
}

/**
 * Result of a successful download and extraction.
 */
export interface DownloadResult {
  agentDir: string;
  version: string;
  name: string;
  scope: string;
}

/**
 * Verify that a buffer's SHA-256 hash matches the expected value.
 */
export function verifyChecksum(buffer: Buffer, expectedSha256: string): boolean {
  const actual = createHash('sha256').update(buffer).digest('hex');
  return actual === expectedSha256;
}

/**
 * Download a tarball from a URL and return it as a Buffer.
 */
async function fetchTarball(url: string): Promise<Buffer> {
  const { ofetch } = await import('ofetch');
  const response = await ofetch(url, { responseType: 'arrayBuffer' });
  return Buffer.from(response);
}

/**
 * Download, verify, and extract an agent tarball to the agents directory.
 *
 * If a tarball buffer and sha256 are provided directly (for testing or
 * pre-fetched scenarios), they are used instead of fetching from the URL.
 */
export async function downloadAndExtract(
  scope: string,
  name: string,
  version: string,
  tarballBuffer: Buffer,
  expectedSha256: string,
): Promise<DownloadResult> {
  // Verify SHA-256
  if (!verifyChecksum(tarballBuffer, expectedSha256)) {
    throw new RegistryError(
      `SHA-256 checksum mismatch for ${scope}/${name}@${version}. ` +
      'The tarball may have been tampered with.',
    );
  }

  // Prepare target directory
  const agentDir = join(AGENTS_DIR, name);
  if (existsSync(agentDir)) {
    rmSync(agentDir, { recursive: true, force: true });
  }
  mkdirSync(agentDir, { recursive: true });

  // Extract tarball
  const stream = Readable.from(tarballBuffer);
  await pipeline(
    stream,
    tar.extract({ cwd: agentDir, strip: 0 }),
  );

  return { agentDir, version, name, scope };
}

/**
 * Fetch agent metadata from the registry.
 */
export async function fetchAgentInfo(
  scope: string,
  name: string,
): Promise<AgentInfo> {
  const client = createRegistryClient();
  return client.get<AgentInfo>(`/agents/${scope}/${name}`);
}

/**
 * Fetch download info (tarball URL and SHA-256) for a specific version.
 */
export async function fetchDownloadInfo(
  scope: string,
  name: string,
  version: string,
): Promise<DownloadInfo> {
  const client = createRegistryClient();
  return client.get<DownloadInfo>(`/agents/${scope}/${name}/download/${version}`);
}

/**
 * Full install flow: fetch metadata, download tarball, verify, extract.
 */
export async function installAgent(
  scope: string,
  name: string,
  requestedVersion?: string,
): Promise<DownloadResult> {
  // Fetch agent info to resolve version
  const info = await fetchAgentInfo(scope, name);
  const version = requestedVersion ?? info.latest_version;

  if (!version) {
    throw new RegistryError(`No version found for ${scope}/${name}`);
  }

  // Fetch download info
  const downloadInfo = await fetchDownloadInfo(scope, name, version);

  // Download tarball
  const tarballBuffer = await fetchTarball(downloadInfo.tarball_url);

  // Verify and extract
  return downloadAndExtract(scope, name, version, tarballBuffer, downloadInfo.tarball_sha256);
}
