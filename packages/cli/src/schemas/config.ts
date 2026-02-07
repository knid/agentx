import { z } from 'zod';

/**
 * Zod schema for the global agentx configuration file (~/.agentx/config.yaml).
 *
 * All fields have sensible defaults so a completely empty config is valid.
 */
export const globalConfigSchema = z.object({
  registry: z.string().url().default('https://agentx-web.vercel.app'),
  claude_path: z.string().default('claude'),
  default_output: z.enum(['text', 'json']).default('text'),
  telemetry: z.boolean().default(true),
  auto_update: z.boolean().default(true),
  claude_defaults: z.object({
    max_turns: z.number().int().positive().default(10),
  }).default({}),
});

/** Inferred TypeScript type from the global config Zod schema. */
export type GlobalConfig = z.infer<typeof globalConfigSchema>;

/** Default configuration produced by parsing an empty object through the schema. */
export const DEFAULT_CONFIG: GlobalConfig = globalConfigSchema.parse({});
