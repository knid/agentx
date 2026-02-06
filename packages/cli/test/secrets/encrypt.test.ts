import { describe, it, expect } from 'vitest';

describe('encrypt', () => {
  describe('encrypt/decrypt roundtrip', () => {
    it('should encrypt and decrypt a secrets object', async () => {
      const { encrypt, decrypt } = await import('../../src/secrets/encrypt.js');

      const secrets = {
        API_KEY: 'sk-test-12345',
        TOKEN: 'ya29.xxxxx',
      };

      const encrypted = await encrypt(secrets);
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      expect(encrypted).toHaveProperty('data');
      expect(typeof encrypted.iv).toBe('string');
      expect(typeof encrypted.tag).toBe('string');
      expect(typeof encrypted.data).toBe('string');

      const decrypted = await decrypt(encrypted);
      expect(decrypted).toEqual(secrets);
    });

    it('should produce different ciphertext for same input (random IV)', async () => {
      const { encrypt } = await import('../../src/secrets/encrypt.js');

      const secrets = { KEY: 'value' };

      const enc1 = await encrypt(secrets);
      const enc2 = await encrypt(secrets);

      expect(enc1.iv).not.toBe(enc2.iv);
      expect(enc1.data).not.toBe(enc2.data);
    });

    it('should handle empty secrets object', async () => {
      const { encrypt, decrypt } = await import('../../src/secrets/encrypt.js');

      const secrets = {};
      const encrypted = await encrypt(secrets);
      const decrypted = await decrypt(encrypted);
      expect(decrypted).toEqual({});
    });

    it('should handle secrets with special characters', async () => {
      const { encrypt, decrypt } = await import('../../src/secrets/encrypt.js');

      const secrets = {
        KEY: 'value with spaces & special chars: !@#$%^&*()',
        UNICODE: '\u3053\u3093\u306b\u3061\u306f',
      };

      const encrypted = await encrypt(secrets);
      const decrypted = await decrypt(encrypted);
      expect(decrypted).toEqual(secrets);
    });
  });

  describe('tamper detection', () => {
    it('should fail to decrypt if data is tampered', async () => {
      const { encrypt, decrypt } = await import('../../src/secrets/encrypt.js');

      const secrets = { KEY: 'value' };
      const encrypted = await encrypt(secrets);

      // Tamper with the encrypted data
      const tampered = { ...encrypted, data: encrypted.data.replace(/[0-9a-f]/, '0') + 'ff' };

      await expect(decrypt(tampered)).rejects.toThrow();
    });

    it('should fail to decrypt if IV is tampered', async () => {
      const { encrypt, decrypt } = await import('../../src/secrets/encrypt.js');

      const secrets = { KEY: 'value' };
      const encrypted = await encrypt(secrets);

      // Tamper with the IV
      const tampered = { ...encrypted, iv: '00'.repeat(12) };

      await expect(decrypt(tampered)).rejects.toThrow();
    });
  });
});
