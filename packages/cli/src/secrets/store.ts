import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { encrypt, decrypt } from './encrypt.js';
import { SECRETS_DIR } from '../config/paths.js';
import type { SecretStore } from '../types/config.js';

function getSecretsFilePath(agentName: string, secretsDir: string): string {
  return join(secretsDir, `${agentName}.enc.json`);
}

export async function saveSecrets(
  agentName: string,
  secrets: Record<string, string>,
  secretsDir: string = SECRETS_DIR,
): Promise<void> {
  mkdirSync(secretsDir, { recursive: true });
  const encrypted = await encrypt(secrets);
  const filePath = getSecretsFilePath(agentName, secretsDir);
  writeFileSync(filePath, JSON.stringify(encrypted, null, 2), 'utf-8');
}

export async function loadSecrets(
  agentName: string,
  secretsDir: string = SECRETS_DIR,
): Promise<Record<string, string>> {
  const filePath = getSecretsFilePath(agentName, secretsDir);

  if (!existsSync(filePath)) {
    return {};
  }

  const raw = readFileSync(filePath, 'utf-8');
  const store: SecretStore = JSON.parse(raw);
  return decrypt(store);
}

export async function deleteSecrets(
  agentName: string,
  secretsDir: string = SECRETS_DIR,
): Promise<void> {
  const filePath = getSecretsFilePath(agentName, secretsDir);
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

export async function hasSecrets(
  agentName: string,
  secretsDir: string = SECRETS_DIR,
): Promise<boolean> {
  const filePath = getSecretsFilePath(agentName, secretsDir);
  return existsSync(filePath);
}
