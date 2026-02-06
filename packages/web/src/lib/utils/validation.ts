import { z } from 'zod';

/**
 * Valid categories for an agent manifest.
 */
export const VALID_CATEGORIES = [
  'productivity',
  'devtools',
  'communication',
  'data',
  'writing',
  'research',
  'automation',
  'security',
  'monitoring',
  'other',
] as const;

/** Regex for valid agent names: lowercase alphanumeric with hyphens. */
const AGENT_NAME_REGEX = /^[a-z0-9-]+$/;

/** Regex for semantic versioning (major.minor.patch with optional pre-release and build metadata). */
const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/;

/**
 * Zod schema for an MCP server configuration entry.
 */
const mcpServerSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
});

/**
 * Zod schema for a secret declaration.
 */
const secretSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  required: z.boolean().default(true),
});

/**
 * Zod schema for agent permissions.
 */
const permissionsSchema = z.object({
  filesystem: z.boolean().optional(),
  network: z.boolean().optional(),
  execute_commands: z.boolean().optional(),
});

/**
 * Zod schema for a config option.
 */
const configOptionSchema = z.object({
  key: z.string(),
  description: z.string().optional(),
  default: z.string().optional(),
});

/**
 * Zod schema for an agent example.
 */
const exampleSchema = z.object({
  prompt: z.string(),
  description: z.string().optional(),
});

/**
 * Zod schema for the `requires` block in agent.yaml.
 */
const requiresSchema = z.object({
  claude_cli: z.string().optional(),
  node: z.string().optional(),
  os: z.array(z.string()).optional(),
});

/**
 * Zod schema for validating an agent.yaml manifest file.
 *
 * Enforces naming conventions, semver versioning, category enums,
 * and structural constraints on all optional blocks.
 */
export const agentYamlSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(AGENT_NAME_REGEX, 'Name must contain only lowercase letters, numbers, and hyphens'),
  version: z
    .string()
    .regex(SEMVER_REGEX, 'Version must be valid semver (e.g. 1.0.0)'),
  description: z.string().min(1).max(500),
  author: z
    .string()
    .refine((val) => val.startsWith('@'), {
      message: 'Author must start with @',
    }),
  license: z.string().default('MIT'),
  tags: z.array(z.string()).max(10).optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
  requires: requiresSchema.optional(),
  mcp_servers: z.record(mcpServerSchema).optional(),
  secrets: z.array(secretSchema).optional(),
  permissions: permissionsSchema.optional(),
  config: z.array(configOptionSchema).optional(),
  examples: z.array(exampleSchema).optional(),
});

/** Inferred TypeScript type from the agent.yaml Zod schema. */
export type AgentYaml = z.infer<typeof agentYamlSchema>;

/** Result of validating an agent.yaml manifest. */
export interface ValidationResult {
  valid: boolean;
  data?: AgentYaml;
  errors?: string[];
}

/**
 * Validates an agent.yaml manifest against the schema.
 *
 * @param data - The parsed YAML data to validate
 * @returns A result object indicating success with parsed data, or failure with error messages
 */
export function validateAgentYaml(data: unknown): ValidationResult {
  const result = agentYamlSchema.safeParse(data);

  if (result.success) {
    return { valid: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });

  return { valid: false, errors };
}
