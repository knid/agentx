import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock execa before importing
vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue({
    stdout: 'mock output',
    stderr: '',
    exitCode: 0,
  }),
}));

// Mock child_process before importing
vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
  spawn: vi.fn(() => ({ unref: vi.fn() })),
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

  describe('executePreRunHooks', () => {
    it('should run foreground hook with execFileSync', async () => {
      const { execFileSync } = await import('node:child_process');
      const { executePreRunHooks } = await import('../../src/runtime/runner.js');

      executePreRunHooks([{ command: 'setup-db', args: ['--migrate'] }]);

      expect(execFileSync).toHaveBeenCalledWith('setup-db', ['--migrate'], { stdio: 'inherit' });
    });

    it('should spawn background hook detached and unref', async () => {
      const { spawn } = await import('node:child_process');
      const { executePreRunHooks } = await import('../../src/runtime/runner.js');

      const mockUnref = vi.fn();
      vi.mocked(spawn).mockReturnValueOnce({ unref: mockUnref } as any);

      executePreRunHooks([{ command: 'whatsapp-bridge', background: true }]);

      expect(spawn).toHaveBeenCalledWith('whatsapp-bridge', [], {
        detached: true,
        stdio: 'ignore',
      });
      expect(mockUnref).toHaveBeenCalled();
    });

    it('should throw when foreground hook fails', async () => {
      const { execFileSync } = await import('node:child_process');
      const { executePreRunHooks } = await import('../../src/runtime/runner.js');

      vi.mocked(execFileSync).mockImplementationOnce(() => {
        throw new Error('command not found');
      });

      expect(() => executePreRunHooks([{ command: 'missing-cmd' }]))
        .toThrow('command not found');
    });

    it('should execute hooks with default empty args when args not provided', async () => {
      const { execFileSync } = await import('node:child_process');
      const { executePreRunHooks } = await import('../../src/runtime/runner.js');

      executePreRunHooks([{ command: 'simple-cmd' }]);

      expect(execFileSync).toHaveBeenCalledWith('simple-cmd', [], { stdio: 'inherit' });
    });
  });
});
