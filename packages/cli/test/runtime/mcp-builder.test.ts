import { describe, it, expect, vi, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('mcp-builder', () => {
  let tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true });
      }
    }
    tempDirs = [];
  });

  describe('resolveMCPConfig', () => {
    it('should resolve ${secrets.KEY} references in env vars', async () => {
      const { resolveMCPConfig } = await import('../../src/runtime/mcp-builder.js');

      const servers = {
        filesystem: {
          command: 'npx',
          args: ['-y', '@anthropic/mcp-server-filesystem'],
          env: {
            ALLOWED_DIR: '${secrets.WORK_DIR}',
            STATIC_VAR: 'static-value',
          },
        },
      };

      const secrets = { WORK_DIR: '/home/user/projects' };

      const result = resolveMCPConfig(servers, secrets);
      expect(result.filesystem.env?.ALLOWED_DIR).toBe('/home/user/projects');
      expect(result.filesystem.env?.STATIC_VAR).toBe('static-value');
    });

    it('should handle empty servers', async () => {
      const { resolveMCPConfig } = await import('../../src/runtime/mcp-builder.js');

      const result = resolveMCPConfig({}, {});
      expect(result).toEqual({});
    });

    it('should handle servers with no env vars', async () => {
      const { resolveMCPConfig } = await import('../../src/runtime/mcp-builder.js');

      const servers = {
        test: { command: 'echo', args: ['hello'] },
      };

      const result = resolveMCPConfig(servers, {});
      expect(result.test.command).toBe('echo');
      expect(result.test.args).toEqual(['hello']);
    });

    it('should leave unresolved secret references as empty string', async () => {
      const { resolveMCPConfig } = await import('../../src/runtime/mcp-builder.js');

      const servers = {
        test: {
          command: 'echo',
          env: { KEY: '${secrets.MISSING}' },
        },
      };

      const result = resolveMCPConfig(servers, {});
      expect(result.test.env?.KEY).toBe('');
    });
  });

  describe('writeTempMCPConfig', () => {
    it('should write valid JSON MCP config to a temp file', async () => {
      const { writeTempMCPConfig } = await import('../../src/runtime/mcp-builder.js');

      const servers = {
        test: { command: 'echo', args: ['hello'] },
      };

      const configPath = await writeTempMCPConfig(servers);
      expect(existsSync(configPath)).toBe(true);

      const content = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(content).toHaveProperty('mcpServers');
      expect(content.mcpServers.test.command).toBe('echo');

      // Cleanup
      rmSync(configPath);
    });
  });
});
