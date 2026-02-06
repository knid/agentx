import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as tar from 'tar';

// Mock the registry client
vi.mock('../../src/registry/client.js', () => ({
  createRegistryClient: vi.fn(),
}));

// Mock paths to use temp dir
const mockAgentsDir = mkdtempSync(join(tmpdir(), 'agentx-test-agents-'));

vi.mock('../../src/config/paths.js', () => ({
  AGENTX_HOME: mockAgentsDir,
  AGENTS_DIR: join(mockAgentsDir, 'agents'),
  SECRETS_DIR: join(mockAgentsDir, 'secrets'),
  CACHE_DIR: join(mockAgentsDir, 'cache'),
  LOGS_DIR: join(mockAgentsDir, 'logs'),
  CONFIG_PATH: join(mockAgentsDir, 'config.yaml'),
  AUTH_PATH: join(mockAgentsDir, 'auth.json'),
}));

describe('download module', () => {
  let testTarball: Buffer;
  let testSha256: string;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create a test tarball
    const sourceDir = mkdtempSync(join(tmpdir(), 'agentx-test-source-'));
    writeFileSync(
      join(sourceDir, 'agent.yaml'),
      'name: test-agent\nversion: "1.0.0"\ndescription: Test\nauthor: "@test"',
    );
    writeFileSync(join(sourceDir, 'system-prompt.md'), '# Test Agent');

    const chunks: Buffer[] = [];
    const stream = tar.create(
      { gzip: true, cwd: sourceDir, portable: true },
      ['agent.yaml', 'system-prompt.md'],
    );
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk as Uint8Array));
    }
    testTarball = Buffer.concat(chunks);

    const { createHash } = await import('node:crypto');
    testSha256 = createHash('sha256').update(testTarball).digest('hex');

    // Ensure agents dir exists
    mkdirSync(join(mockAgentsDir, 'agents'), { recursive: true });

    // Clean up source
    rmSync(sourceDir, { recursive: true, force: true });
  });

  afterEach(() => {
    // Clean up agents dir contents
    const agentsPath = join(mockAgentsDir, 'agents');
    if (existsSync(agentsPath)) {
      rmSync(agentsPath, { recursive: true, force: true });
      mkdirSync(agentsPath, { recursive: true });
    }
  });

  describe('downloadAndExtract', () => {
    it('should download tarball, verify SHA-256, and extract to agents dir', async () => {
      const { createRegistryClient } = await import('../../src/registry/client.js');
      const mockClient = {
        get: vi.fn()
          .mockResolvedValueOnce({
            scope: '@test',
            name: 'test-agent',
            latest_version: '1.0.0',
          })
          .mockResolvedValueOnce({
            tarball_url: 'https://r2.example.com/test-agent/1.0.0.tar.gz',
            tarball_sha256: testSha256,
            version: '1.0.0',
          }),
        post: vi.fn(),
        put: vi.fn(),
      };
      vi.mocked(createRegistryClient).mockReturnValue(mockClient);

      // Mock ofetch for the tarball download
      const { downloadAndExtract } = await import('../../src/registry/download.js');

      // We need to mock the actual tarball fetch
      vi.doMock('ofetch', () => ({
        ofetch: vi.fn().mockResolvedValue(testTarball),
      }));

      const result = await downloadAndExtract('@test', 'test-agent', '1.0.0', testTarball, testSha256);

      expect(result.agentDir).toContain('test-agent');
      expect(existsSync(result.agentDir)).toBe(true);
      expect(existsSync(join(result.agentDir, 'agent.yaml'))).toBe(true);
      expect(existsSync(join(result.agentDir, 'system-prompt.md'))).toBe(true);
    });

    it('should throw on SHA-256 mismatch', async () => {
      const { downloadAndExtract } = await import('../../src/registry/download.js');

      await expect(
        downloadAndExtract('@test', 'test-agent', '1.0.0', testTarball, 'bad-hash-value'),
      ).rejects.toThrow(/SHA-256/i);
    });
  });

  describe('verifyChecksum', () => {
    it('should return true for matching checksum', async () => {
      const { verifyChecksum } = await import('../../src/registry/download.js');
      expect(verifyChecksum(testTarball, testSha256)).toBe(true);
    });

    it('should return false for mismatched checksum', async () => {
      const { verifyChecksum } = await import('../../src/registry/download.js');
      expect(verifyChecksum(testTarball, 'abcdef1234567890')).toBe(false);
    });
  });
});
