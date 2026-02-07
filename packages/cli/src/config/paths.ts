import { homedir } from 'node:os';
import { join } from 'node:path';

export const AGENTX_HOME = join(homedir(), '.agentx');
export const AGENTS_DIR = join(AGENTX_HOME, 'agents');
export const SECRETS_DIR = join(AGENTX_HOME, 'secrets');
export const CONFIG_PATH = join(AGENTX_HOME, 'config.yaml');
export const AUTH_PATH = join(AGENTX_HOME, 'auth.json');
export const CACHE_DIR = join(AGENTX_HOME, 'cache');
export const LOGS_DIR = join(AGENTX_HOME, 'logs');
export const SCHEDULER_DIR = join(AGENTX_HOME, 'scheduler');
export const SCHEDULER_PID = join(SCHEDULER_DIR, 'scheduler.pid');
export const SCHEDULER_STATE = join(SCHEDULER_DIR, 'state.json');
export const SCHEDULER_LOGS_DIR = join(SCHEDULER_DIR, 'logs');
