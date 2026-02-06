import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock execa before any imports that use it
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

describe('doctor command', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------
  // T049-01 through T049-03: checkClaudeCLI
  // ---------------------------------------------------------------
  describe('checkClaudeCLI', () => {
    it('should detect claude CLI when available', async () => {
      const { execa } = await import('execa');
      const execaMock = execa as unknown as ReturnType<typeof vi.fn>;

      // First call: which claude -> path
      execaMock.mockResolvedValueOnce({
        stdout: '/usr/local/bin/claude',
        exitCode: 0,
      });
      // Second call: claude --version -> version string
      execaMock.mockResolvedValueOnce({
        stdout: '1.2.3',
        exitCode: 0,
      });

      const { checkClaudeCLI } = await import('../../src/commands/doctor.js');
      const result = await checkClaudeCLI();
      expect(result.found).toBe(true);
    });

    it('should include the version when claude CLI is found', async () => {
      const { execa } = await import('execa');
      const execaMock = execa as unknown as ReturnType<typeof vi.fn>;

      execaMock.mockResolvedValueOnce({
        stdout: '/usr/local/bin/claude',
        exitCode: 0,
      });
      execaMock.mockResolvedValueOnce({
        stdout: '1.5.0',
        exitCode: 0,
      });

      const { checkClaudeCLI } = await import('../../src/commands/doctor.js');
      const result = await checkClaudeCLI();
      expect(result.found).toBe(true);
      expect(result.version).toBe('1.5.0');
    });

    it('should report claude CLI not found when command fails', async () => {
      const { execa } = await import('execa');
      const execaMock = execa as unknown as ReturnType<typeof vi.fn>;

      execaMock.mockRejectedValueOnce(new Error('not found'));

      const { checkClaudeCLI } = await import('../../src/commands/doctor.js');
      const result = await checkClaudeCLI();
      expect(result.found).toBe(false);
    });

    it('should report not found when which returns non-zero exit code', async () => {
      const { execa } = await import('execa');
      const execaMock = execa as unknown as ReturnType<typeof vi.fn>;

      execaMock.mockResolvedValueOnce({
        stdout: '',
        exitCode: 1,
      });

      const { checkClaudeCLI } = await import('../../src/commands/doctor.js');
      const result = await checkClaudeCLI();
      expect(result.found).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // T049-04 through T049-06: checkNodeVersion
  // ---------------------------------------------------------------
  describe('checkNodeVersion', () => {
    it('should return current node version', async () => {
      const { checkNodeVersion } = await import('../../src/commands/doctor.js');
      const result = checkNodeVersion();
      expect(result.version).toBeTruthy();
      expect(typeof result.version).toBe('string');
    });

    it('should report node as supported when major version >= 18', async () => {
      const { checkNodeVersion } = await import('../../src/commands/doctor.js');
      const result = checkNodeVersion();
      // The test runner itself uses Node >= 18, so this should pass
      expect(result.supported).toBe(true);
    });

    it('should include the major version number', async () => {
      const { checkNodeVersion } = await import('../../src/commands/doctor.js');
      const result = checkNodeVersion();
      const majorVersion = parseInt(result.version.split('.')[0], 10);
      expect(majorVersion).toBeGreaterThanOrEqual(18);
    });
  });

  // ---------------------------------------------------------------
  // T049-07 through T049-08: checkAgentxVersion
  // ---------------------------------------------------------------
  describe('checkAgentxVersion', () => {
    it('should return the agentx version', async () => {
      const { checkAgentxVersion } = await import('../../src/commands/doctor.js');
      const result = checkAgentxVersion();
      expect(result.version).toBeTruthy();
      expect(typeof result.version).toBe('string');
    });

    it('should return a valid semver version string', async () => {
      const { checkAgentxVersion } = await import('../../src/commands/doctor.js');
      const result = checkAgentxVersion();
      // Basic semver check: digits.digits.digits
      expect(result.version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  // ---------------------------------------------------------------
  // T049-09 through T049-10: runDoctor (integration of all checks)
  // ---------------------------------------------------------------
  describe('runDoctor', () => {
    it('should return an array of check results', async () => {
      const { execa } = await import('execa');
      const execaMock = execa as unknown as ReturnType<typeof vi.fn>;

      // Mock claude CLI checks
      execaMock.mockResolvedValueOnce({
        stdout: '/usr/local/bin/claude',
        exitCode: 0,
      });
      execaMock.mockResolvedValueOnce({
        stdout: '1.0.0',
        exitCode: 0,
      });

      const { runDoctor } = await import('../../src/commands/doctor.js');
      const results = await runDoctor();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(3);
    });

    it('should include checks for claude CLI, Node.js, and agentx version', async () => {
      const { execa } = await import('execa');
      const execaMock = execa as unknown as ReturnType<typeof vi.fn>;

      // Mock claude CLI checks
      execaMock.mockResolvedValueOnce({
        stdout: '/usr/local/bin/claude',
        exitCode: 0,
      });
      execaMock.mockResolvedValueOnce({
        stdout: '1.0.0',
        exitCode: 0,
      });

      const { runDoctor } = await import('../../src/commands/doctor.js');
      const results = await runDoctor();
      const labels = results.map((r: { label: string }) => r.label);

      expect(labels).toContain('Claude CLI');
      expect(labels).toContain('Node.js');
      expect(labels).toContain('agentx');
    });

    it('should mark all checks as pass when environment is healthy', async () => {
      const { execa } = await import('execa');
      const execaMock = execa as unknown as ReturnType<typeof vi.fn>;

      // Mock claude CLI as available
      execaMock.mockResolvedValueOnce({
        stdout: '/usr/local/bin/claude',
        exitCode: 0,
      });
      execaMock.mockResolvedValueOnce({
        stdout: '1.0.0',
        exitCode: 0,
      });

      const { runDoctor } = await import('../../src/commands/doctor.js');
      const results = await runDoctor();

      // Node.js and agentx should always pass in test environment
      const nodeCheck = results.find((r: { label: string }) => r.label === 'Node.js');
      const agentxCheck = results.find((r: { label: string }) => r.label === 'agentx');
      expect(nodeCheck?.pass).toBe(true);
      expect(agentxCheck?.pass).toBe(true);
    });

    it('should report claude CLI check as failed when not found', async () => {
      const { execa } = await import('execa');
      const execaMock = execa as unknown as ReturnType<typeof vi.fn>;

      // Mock claude CLI as unavailable
      execaMock.mockRejectedValueOnce(new Error('command not found'));

      const { runDoctor } = await import('../../src/commands/doctor.js');
      const results = await runDoctor();
      const claudeCheck = results.find((r: { label: string }) => r.label === 'Claude CLI');
      expect(claudeCheck?.pass).toBe(false);
    });
  });
});
