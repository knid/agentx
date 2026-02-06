import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock execa before importing
vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue({
    stdout: 'mock output',
    stderr: '',
    exitCode: 0,
  }),
}));

describe('runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildClaudeArgs', () => {
    it('should build correct args for non-interactive mode with prompt', async () => {
      const { buildClaudeArgs } = await import('../../src/runtime/runner.js');

      const args = buildClaudeArgs({
        prompt: 'hello world',
        systemPrompt: 'You are helpful',
        mcpConfigPath: '/tmp/mcp.json',
        maxTurns: 10,
        outputFormat: 'text',
      });

      expect(args).toContain('-p');
      expect(args).toContain('hello world');
      expect(args).toContain('--system-prompt');
      expect(args).toContain('--mcp-config');
      expect(args).toContain('/tmp/mcp.json');
    });

    it('should exclude -p flag for interactive mode', async () => {
      const { buildClaudeArgs } = await import('../../src/runtime/runner.js');

      const args = buildClaudeArgs({
        interactive: true,
        systemPrompt: 'You are helpful',
      });

      expect(args).not.toContain('-p');
      expect(args).toContain('--system-prompt');
    });

    it('should include --output-format when specified', async () => {
      const { buildClaudeArgs } = await import('../../src/runtime/runner.js');

      const args = buildClaudeArgs({
        prompt: 'test',
        systemPrompt: 'test',
        outputFormat: 'json',
      });

      expect(args).toContain('--output-format');
      expect(args).toContain('json');
    });

    it('should include --max-turns when specified', async () => {
      const { buildClaudeArgs } = await import('../../src/runtime/runner.js');

      const args = buildClaudeArgs({
        prompt: 'test',
        systemPrompt: 'test',
        maxTurns: 5,
      });

      expect(args).toContain('--max-turns');
      expect(args).toContain('5');
    });
  });

  describe('runAgent', () => {
    it('should throw if agent not found', async () => {
      const { runAgent } = await import('../../src/runtime/runner.js');

      await expect(runAgent('nonexistent-agent', { prompt: 'hello' }))
        .rejects.toThrow();
    });
  });
});
