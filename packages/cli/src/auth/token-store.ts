import { readFileSync, writeFileSync, unlinkSync, existsSync, chmodSync } from 'node:fs';
import { AUTH_PATH } from '../config/paths.js';
import { ensureDirectories } from '../utils/init-dirs.js';
import type { AuthToken } from '../types/config.js';

/**
 * Save an authentication token to disk at {@link AUTH_PATH}.
 *
 * Ensures the parent directories exist before writing.
 *
 * @param token - The auth token to persist.
 */
export function saveToken(token: AuthToken): void {
  ensureDirectories();
  writeFileSync(AUTH_PATH, JSON.stringify(token, null, 2), 'utf-8');
  chmodSync(AUTH_PATH, 0o600);
}

/**
 * Load the authentication token from disk.
 *
 * @returns The persisted auth token, or `null` if the file does not exist.
 */
export function loadToken(): AuthToken | null {
  if (!existsSync(AUTH_PATH)) {
    return null;
  }

  try {
    const raw = readFileSync(AUTH_PATH, 'utf-8');
    return JSON.parse(raw) as AuthToken;
  } catch {
    return null;
  }
}

/**
 * Delete the authentication token file from disk.
 * No-op if the file does not exist.
 */
export function clearToken(): void {
  if (existsSync(AUTH_PATH)) {
    unlinkSync(AUTH_PATH);
  }
}

/**
 * Check whether an authentication token file exists on disk.
 *
 * @returns `true` if the token file exists, `false` otherwise.
 */
export function isAuthenticated(): boolean {
  return existsSync(AUTH_PATH);
}
