import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parse, stringify } from 'yaml';
import { CONFIG_PATH } from './paths.js';
import { globalConfigSchema, DEFAULT_CONFIG } from '../schemas/config.js';
import type { GlobalConfig } from '../schemas/config.js';
import { ConfigError } from '../utils/errors.js';
import { ensureDirectories } from '../utils/init-dirs.js';

export function loadGlobalConfig(): GlobalConfig {
  ensureDirectories();

  if (!existsSync(CONFIG_PATH)) {
    return DEFAULT_CONFIG;
  }

  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = parse(raw);
    return globalConfigSchema.parse(parsed);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      throw new ConfigError(`Invalid config at ${CONFIG_PATH}: ${error.message}`);
    }
    throw new ConfigError(`Failed to read config: ${(error as Error).message}`);
  }
}

export function saveGlobalConfig(config: GlobalConfig): void {
  ensureDirectories();

  try {
    const yaml = stringify(config);
    writeFileSync(CONFIG_PATH, yaml, 'utf-8');
  } catch (error) {
    throw new ConfigError(`Failed to save config: ${(error as Error).message}`);
  }
}

export function getConfigValue<K extends keyof GlobalConfig>(key: K): GlobalConfig[K] {
  const config = loadGlobalConfig();
  return config[key];
}

export function setConfigValue<K extends keyof GlobalConfig>(
  key: K,
  value: GlobalConfig[K],
): void {
  const config = loadGlobalConfig();
  config[key] = value;
  saveGlobalConfig(config);
}
