import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import type { MCPServerConfig } from '../types/agent.js';

/**
 * Resolve ${secrets.KEY} references in MCP server environment variables.
 * Unresolved references become empty strings.
 */
export function resolveMCPConfig(
  servers: Record<string, MCPServerConfig>,
  secrets: Record<string, string>,
): Record<string, MCPServerConfig> {
  const resolved: Record<string, MCPServerConfig> = {};

  for (const [name, server] of Object.entries(servers)) {
    const resolvedEnv: Record<string, string> = {};

    if (server.env) {
      for (const [envKey, envValue] of Object.entries(server.env)) {
        resolvedEnv[envKey] = envValue.replace(
          /\$\{secrets\.(\w+)\}/g,
          (_match, secretKey: string) => secrets[secretKey] ?? '',
        );
      }
    }

    resolved[name] = {
      command: server.command,
      ...(server.args ? { args: server.args } : {}),
      ...(server.env ? { env: resolvedEnv } : {}),
    };
  }

  return resolved;
}

/**
 * Write resolved MCP server config to a temporary JSON file
 * in the format expected by Claude CLI's --mcp-config flag.
 */
export async function writeTempMCPConfig(
  servers: Record<string, MCPServerConfig>,
): Promise<string> {
  const tempDir = join(tmpdir(), 'agentx-mcp');
  mkdirSync(tempDir, { recursive: true });

  const configPath = join(tempDir, `${randomUUID()}.json`);
  const config = { mcpServers: servers };

  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  return configPath;
}
