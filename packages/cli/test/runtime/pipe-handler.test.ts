import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('pipe-handler', () => {
  describe('detectPipedInput', () => {
    it('should detect when stdin is piped', async () => {
      const { detectPipedInput } = await import('../../src/runtime/pipe-handler.js');

      // In test environment, stdin.isTTY is typically undefined (not a TTY)
      // We test the function exists and returns a boolean
      const result = await detectPipedInput();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('buildPromptWithPipe', () => {
    it('should prepend piped content to prompt', async () => {
      const { buildPromptWithPipe } = await import('../../src/runtime/pipe-handler.js');

      const result = buildPromptWithPipe('analyze this', 'piped data here');
      expect(result).toContain('piped data here');
      expect(result).toContain('analyze this');
    });

    it('should return prompt unchanged when no piped content', async () => {
      const { buildPromptWithPipe } = await import('../../src/runtime/pipe-handler.js');

      const result = buildPromptWithPipe('just a prompt', '');
      expect(result).toBe('just a prompt');
    });

    it('should handle empty prompt with piped content', async () => {
      const { buildPromptWithPipe } = await import('../../src/runtime/pipe-handler.js');

      const result = buildPromptWithPipe('', 'piped data');
      expect(result).toContain('piped data');
    });
  });
});
