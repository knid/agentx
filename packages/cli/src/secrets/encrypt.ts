import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { platform, hostname, homedir } from 'node:os';
import type { SecretStore } from '../types/config.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const SALT = 'agentx-salt';

function getMachineId(): string {
  const os = platform();

  if (os === 'linux' && existsSync('/etc/machine-id')) {
    return readFileSync('/etc/machine-id', 'utf-8').trim();
  }

  if (os === 'darwin') {
    try {
      const output = execFileSync(
        'ioreg',
        ['-rd1', '-c', 'IOPlatformExpertDevice'],
        { encoding: 'utf-8' },
      );
      const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
      if (match) return match[1];
    } catch {
      // fall through
    }
  }

  // Fallback: use hostname + homedir as a semi-stable identifier
  return `${hostname()}-${homedir()}`;
}

function deriveKey(): Buffer {
  const machineId = getMachineId();
  return scryptSync(machineId, SALT, KEY_LENGTH);
}

export async function encrypt(secrets: Record<string, string>): Promise<SecretStore> {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(secrets);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted.toString('hex'),
  };
}

export async function decrypt(store: SecretStore): Promise<Record<string, string>> {
  const key = deriveKey();
  const iv = Buffer.from(store.iv, 'hex');
  const tag = Buffer.from(store.tag, 'hex');
  const data = Buffer.from(store.data, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString('utf-8'));
}
