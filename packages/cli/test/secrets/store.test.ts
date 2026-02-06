import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('secret store', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'agentx-test-'));
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
  });

  describe('saveSecrets / loadSecrets', () => {
    it('should save and load secrets for an agent', async () => {
      const { saveSecrets, loadSecrets } = await import('../../src/secrets/store.js');

      const secrets = {
        API_KEY: 'test-key-123',
        TOKEN: 'test-token-456',
      };

      await saveSecrets('test-agent', secrets, tempDir);
      const loaded = await loadSecrets('test-agent', tempDir);
      expect(loaded).toEqual(secrets);
    });

    it('should return empty object when no secrets file exists', async () => {
      const { loadSecrets } = await import('../../src/secrets/store.js');

      const loaded = await loadSecrets('nonexistent-agent', tempDir);
      expect(loaded).toEqual({});
    });

    it('should overwrite existing secrets', async () => {
      const { saveSecrets, loadSecrets } = await import('../../src/secrets/store.js');

      await saveSecrets('test-agent', { KEY: 'old' }, tempDir);
      await saveSecrets('test-agent', { KEY: 'new', EXTRA: 'value' }, tempDir);

      const loaded = await loadSecrets('test-agent', tempDir);
      expect(loaded).toEqual({ KEY: 'new', EXTRA: 'value' });
    });
  });

  describe('deleteSecrets', () => {
    it('should delete secrets file for an agent', async () => {
      const { saveSecrets, deleteSecrets, hasSecrets } = await import('../../src/secrets/store.js');

      await saveSecrets('test-agent', { KEY: 'value' }, tempDir);
      expect(await hasSecrets('test-agent', tempDir)).toBe(true);

      await deleteSecrets('test-agent', tempDir);
      expect(await hasSecrets('test-agent', tempDir)).toBe(false);
    });

    it('should not throw when deleting nonexistent secrets', async () => {
      const { deleteSecrets } = await import('../../src/secrets/store.js');

      await expect(deleteSecrets('nonexistent', tempDir)).resolves.not.toThrow();
    });
  });

  describe('hasSecrets', () => {
    it('should return true when secrets exist', async () => {
      const { saveSecrets, hasSecrets } = await import('../../src/secrets/store.js');

      await saveSecrets('test-agent', { KEY: 'val' }, tempDir);
      expect(await hasSecrets('test-agent', tempDir)).toBe(true);
    });

    it('should return false when no secrets exist', async () => {
      const { hasSecrets } = await import('../../src/secrets/store.js');

      expect(await hasSecrets('no-agent', tempDir)).toBe(false);
    });
  });
});
