import { describe, it, expect } from 'vitest';
import { agentYamlSchema, VALID_CATEGORIES } from '../../src/schemas/agent-yaml.js';

describe('agent-yaml schema', () => {
  const validMinimal = {
    name: 'test-agent',
    version: '1.0.0',
    description: 'A test agent',
    author: '@testuser',
  };

  // ---------------------------------------------------------------
  // T048-01 through T048-03: Valid schemas
  // ---------------------------------------------------------------
  describe('valid schemas', () => {
    it('should accept minimal valid agent.yaml (name, version, description, author only)', () => {
      const result = agentYamlSchema.safeParse(validMinimal);
      expect(result.success).toBe(true);
    });

    it('should default license to MIT when not provided', () => {
      const result = agentYamlSchema.parse(validMinimal);
      expect(result.license).toBe('MIT');
    });

    it('should accept full agent.yaml with all optional fields', () => {
      const full = {
        ...validMinimal,
        license: 'Apache-2.0',
        tags: ['test', 'demo'],
        category: 'devtools',
        requires: {
          claude_cli: '>=1.0.0',
          node: '>=18',
          os: ['darwin', 'linux'],
        },
        mcp_servers: {
          filesystem: {
            command: 'npx',
            args: ['-y', '@anthropic/mcp-server-filesystem'],
            env: { DIR: '/tmp' },
          },
        },
        secrets: [
          { name: 'API_KEY', description: 'The API key', required: true },
        ],
        permissions: {
          filesystem: true,
          network: false,
          execute_commands: false,
        },
        config: [
          { key: 'max_files', description: 'Max files', default: '100' },
        ],
        examples: [
          { prompt: 'hello world', description: 'Basic test' },
        ],
      };

      const result = agentYamlSchema.safeParse(full);
      expect(result.success).toBe(true);
    });

    it('should accept a name with hyphens and numbers', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        name: 'my-agent-42',
      });
      expect(result.success).toBe(true);
    });

    it('should accept semver with pre-release and build metadata', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        version: '1.2.3-alpha.1+build.456',
      });
      expect(result.success).toBe(true);
    });

    it('should accept an explicit license override', () => {
      const result = agentYamlSchema.parse({
        ...validMinimal,
        license: 'GPL-3.0',
      });
      expect(result.license).toBe('GPL-3.0');
    });

    it('should accept an empty tags array', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        tags: [],
      });
      expect(result.success).toBe(true);
    });

    it('should accept exactly 10 tags', () => {
      const tags = Array.from({ length: 10 }, (_, i) => `tag${i}`);
      const result = agentYamlSchema.safeParse({ ...validMinimal, tags });
      expect(result.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // T048-04 through T048-12: Missing required fields
  // ---------------------------------------------------------------
  describe('missing required fields', () => {
    it('should reject missing name', () => {
      const { name, ...rest } = validMinimal;
      const result = agentYamlSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing version', () => {
      const { version, ...rest } = validMinimal;
      const result = agentYamlSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing description', () => {
      const { description, ...rest } = validMinimal;
      const result = agentYamlSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing author', () => {
      const { author, ...rest } = validMinimal;
      const result = agentYamlSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // T048-13 through T048-15: Invalid name format
  // ---------------------------------------------------------------
  describe('invalid name format', () => {
    it('should reject uppercase name', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        name: 'INVALID',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name with special characters', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        name: 'invalid_name!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name with underscores', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        name: 'invalid_name',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name with spaces', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        name: 'invalid name',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        name: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name longer than 100 characters', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        name: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // T048-16 through T048-18: Invalid semver version
  // ---------------------------------------------------------------
  describe('invalid semver version', () => {
    it('should reject non-semver string', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        version: 'not-semver',
      });
      expect(result.success).toBe(false);
    });

    it('should reject version with only major', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        version: '1',
      });
      expect(result.success).toBe(false);
    });

    it('should reject version with only major.minor', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        version: '1.0',
      });
      expect(result.success).toBe(false);
    });

    it('should reject version with leading v', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        version: 'v1.0.0',
      });
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // T048-19: Invalid category
  // ---------------------------------------------------------------
  describe('invalid category', () => {
    it('should reject category not in the allowed list', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        category: 'invalid-cat',
      });
      expect(result.success).toBe(false);
    });

    it('should accept all valid categories', () => {
      for (const category of VALID_CATEGORIES) {
        const result = agentYamlSchema.safeParse({
          ...validMinimal,
          category,
        });
        expect(result.success, `category "${category}" should be valid`).toBe(true);
      }
    });
  });

  // ---------------------------------------------------------------
  // T048-20: Description too long
  // ---------------------------------------------------------------
  describe('description constraints', () => {
    it('should reject description longer than 500 characters', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        description: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should accept description exactly 500 characters', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        description: 'a'.repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty description', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        description: '',
      });
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // T048-21: Tags array constraints
  // ---------------------------------------------------------------
  describe('tags constraints', () => {
    it('should reject more than 10 tags', () => {
      const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
      const result = agentYamlSchema.safeParse({ ...validMinimal, tags });
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // T048-22: Author constraints
  // ---------------------------------------------------------------
  describe('author constraints', () => {
    it('should reject author not starting with @', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        author: 'noatsign',
      });
      expect(result.success).toBe(false);
    });

    it('should accept author starting with @', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        author: '@validuser',
      });
      expect(result.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // T048-23 through T048-25: MCP servers
  // ---------------------------------------------------------------
  describe('mcp_servers', () => {
    it('should accept valid mcp_servers with env vars', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        mcp_servers: {
          filesystem: {
            command: 'npx',
            args: ['-y', '@anthropic/mcp-server-filesystem'],
            env: { ALLOWED_DIR: '${secrets.WORK_DIR}' },
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it('should accept mcp_servers with only command (no args or env)', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        mcp_servers: {
          simple: { command: 'my-server' },
        },
      });
      expect(result.success).toBe(true);
    });

    it('should accept multiple mcp_servers', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        mcp_servers: {
          server1: { command: 'cmd1', args: ['--flag'] },
          server2: { command: 'cmd2', env: { KEY: 'val' } },
        },
      });
      expect(result.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // T048-26 through T048-28: Secrets declarations
  // ---------------------------------------------------------------
  describe('secrets', () => {
    it('should accept valid secrets declarations', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        secrets: [
          { name: 'API_KEY', description: 'Primary API key', required: true },
          { name: 'OPTIONAL_TOKEN', description: 'Optional token', required: false },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should accept secret with only name (other fields optional)', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        secrets: [{ name: 'MY_SECRET' }],
      });
      expect(result.success).toBe(true);
    });

    it('should default secret required to true', () => {
      const result = agentYamlSchema.parse({
        ...validMinimal,
        secrets: [{ name: 'MY_SECRET' }],
      });
      expect(result.secrets![0].required).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // T048-29 through T048-30: Permissions object
  // ---------------------------------------------------------------
  describe('permissions', () => {
    it('should accept valid permissions object', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        permissions: {
          filesystem: true,
          network: false,
          execute_commands: true,
        },
      });
      expect(result.success).toBe(true);
    });

    it('should accept partial permissions (all fields optional)', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        permissions: { filesystem: true },
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty permissions object', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        permissions: {},
      });
      expect(result.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // T048-31 through T048-32: Config options
  // ---------------------------------------------------------------
  describe('config', () => {
    it('should accept valid config options', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        config: [
          { key: 'max_files', description: 'Max files', default: '100' },
          { key: 'mode' },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // T048-33 through T048-34: Examples
  // ---------------------------------------------------------------
  describe('examples', () => {
    it('should accept valid examples', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        examples: [
          { prompt: 'hello world', description: 'Basic greeting test' },
          { prompt: 'analyze data' },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // T048-35 through T048-36: Requires block
  // ---------------------------------------------------------------
  describe('requires', () => {
    it('should accept valid requires block', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        requires: {
          claude_cli: '>=1.0.0',
          node: '>=18',
          os: ['darwin', 'linux', 'win32'],
        },
      });
      expect(result.success).toBe(true);
    });

    it('should accept partial requires (all fields optional)', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        requires: { node: '>=20' },
      });
      expect(result.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // Schedule block validation
  // ---------------------------------------------------------------
  describe('schedule block', () => {
    it('should accept valid schedule with single entry', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        schedule: [
          { name: 'Daily standup', cron: '0 9 * * 1-5', prompt: 'Post standup' },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should accept schedule entry without name (optional)', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        schedule: [
          { cron: '0 9 * * *', prompt: 'Do something daily' },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should accept multiple schedule entries', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        schedule: [
          { name: 'Morning', cron: '0 9 * * *', prompt: 'Morning task' },
          { name: 'Evening', cron: '0 17 * * *', prompt: 'Evening task' },
          { cron: '*/15 * * * *', prompt: 'Frequent check' },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid cron expression', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        schedule: [
          { cron: 'not a cron', prompt: 'Do something' },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should reject schedule entry missing prompt', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        schedule: [
          { cron: '0 9 * * *' },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty prompt', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        schedule: [
          { cron: '0 9 * * *', prompt: '' },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should reject prompt exceeding 2000 characters', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        schedule: [
          { cron: '0 9 * * *', prompt: 'x'.repeat(2001) },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should accept prompt exactly 2000 characters', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        schedule: [
          { cron: '0 9 * * *', prompt: 'x'.repeat(2000) },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject more than 10 schedule entries', () => {
      const entries = Array.from({ length: 11 }, (_, i) => ({
        name: `Schedule ${i}`,
        cron: '0 9 * * *',
        prompt: `Task ${i}`,
      }));
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        schedule: entries,
      });
      expect(result.success).toBe(false);
    });

    it('should accept exactly 10 schedule entries', () => {
      const entries = Array.from({ length: 10 }, (_, i) => ({
        name: `Schedule ${i}`,
        cron: '0 9 * * *',
        prompt: `Task ${i}`,
      }));
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        schedule: entries,
      });
      expect(result.success).toBe(true);
    });

    it('should reject schedule entry with missing cron', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        schedule: [
          { name: 'No cron', prompt: 'Do something' },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should accept common cron patterns', () => {
      const patterns = [
        '* * * * *',        // every minute
        '0 * * * *',        // every hour
        '0 0 * * *',        // daily at midnight
        '0 9 * * 1-5',      // weekdays at 9am
        '*/5 * * * *',      // every 5 minutes
        '0 0 1 * *',        // first of every month
        '0 0 * * 0',        // every sunday
      ];
      for (const cron of patterns) {
        const result = agentYamlSchema.safeParse({
          ...validMinimal,
          schedule: [{ cron, prompt: 'test' }],
        });
        expect(result.success, `cron "${cron}" should be valid`).toBe(true);
      }
    });

    it('should not affect existing agents without schedule block', () => {
      const result = agentYamlSchema.safeParse(validMinimal);
      expect(result.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // pre_run block validation
  // ---------------------------------------------------------------
  describe('pre_run block', () => {
    it('should accept valid pre_run with command and args', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        pre_run: [
          { command: 'whatsapp-bridge', args: ['--port', '8080'] },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should accept pre_run with background: true', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        pre_run: [
          { command: 'whatsapp-bridge', background: true },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should accept pre_run with only command (args and background optional)', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        pre_run: [{ command: 'setup-script' }],
      });
      expect(result.success).toBe(true);
    });

    it('should reject pre_run entry with missing command', () => {
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        pre_run: [{ args: ['--flag'] }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 5 pre_run entries', () => {
      const entries = Array.from({ length: 6 }, (_, i) => ({
        command: `cmd-${i}`,
      }));
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        pre_run: entries,
      });
      expect(result.success).toBe(false);
    });

    it('should accept exactly 5 pre_run entries', () => {
      const entries = Array.from({ length: 5 }, (_, i) => ({
        command: `cmd-${i}`,
      }));
      const result = agentYamlSchema.safeParse({
        ...validMinimal,
        pre_run: entries,
      });
      expect(result.success).toBe(true);
    });

    it('should not affect existing agents without pre_run block', () => {
      const result = agentYamlSchema.safeParse(validMinimal);
      expect(result.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // T048-37: VALID_CATEGORIES export
  // ---------------------------------------------------------------
  describe('VALID_CATEGORIES', () => {
    it('should contain expected categories', () => {
      expect(VALID_CATEGORIES).toContain('productivity');
      expect(VALID_CATEGORIES).toContain('devtools');
      expect(VALID_CATEGORIES).toContain('communication');
      expect(VALID_CATEGORIES).toContain('data');
      expect(VALID_CATEGORIES).toContain('writing');
      expect(VALID_CATEGORIES).toContain('research');
      expect(VALID_CATEGORIES).toContain('automation');
      expect(VALID_CATEGORIES).toContain('security');
      expect(VALID_CATEGORIES).toContain('monitoring');
      expect(VALID_CATEGORIES).toContain('other');
    });

    it('should have exactly 10 categories', () => {
      expect(VALID_CATEGORIES).toHaveLength(10);
    });
  });
});
