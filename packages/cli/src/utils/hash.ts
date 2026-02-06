import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

/**
 * Compute the SHA-256 hash of a buffer and return the hex-encoded string.
 *
 * @param buffer - The data to hash.
 * @returns Hex-encoded SHA-256 digest.
 */
export function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Read a file and return its SHA-256 hash as a hex-encoded string.
 *
 * @param filePath - Absolute path to the file to hash.
 * @returns Hex-encoded SHA-256 digest of the file contents.
 */
export async function hashFile(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  return hashBuffer(data);
}
