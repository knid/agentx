/**
 * Persisted authentication token stored in ~/.agentx/auth.json.
 */
export interface AuthToken {
  token: string;
  username: string;
  github_id: number;
  created_at: string;
}

/**
 * Encrypted secret store entry persisted to disk.
 * Uses AES-256-GCM with an initialization vector and auth tag.
 */
export interface SecretStore {
  /** Hex-encoded initialization vector. */
  iv: string;
  /** Hex-encoded authentication tag. */
  tag: string;
  /** Hex-encoded encrypted data. */
  data: string;
}

// Re-export GlobalConfig from schemas so consumers can import from types.
export type { GlobalConfig } from '../schemas/config.js';
