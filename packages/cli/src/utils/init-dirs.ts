import { mkdirSync, existsSync } from 'node:fs';
import { AGENTX_HOME, AGENTS_DIR, SECRETS_DIR, CACHE_DIR, LOGS_DIR } from '../config/paths.js';

const REQUIRED_DIRS = [AGENTX_HOME, AGENTS_DIR, SECRETS_DIR, CACHE_DIR, LOGS_DIR];

export function ensureDirectories(): void {
  for (const dir of REQUIRED_DIRS) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}
