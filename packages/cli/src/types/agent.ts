/**
 * Configuration for a single MCP server declared in agent.yaml.
 */
export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * A secret that an agent requires at runtime.
 */
export interface SecretDeclaration {
  name: string;
  description?: string;
  required?: boolean;
}

/**
 * Host permissions an agent may request.
 */
export interface Permission {
  filesystem?: boolean;
  network?: boolean;
  execute_commands?: boolean;
}

/**
 * A user-configurable option exposed by an agent.
 */
export interface ConfigOption {
  key: string;
  description?: string;
  default?: string;
}

/**
 * An example prompt demonstrating agent usage.
 */
export interface AgentExample {
  prompt: string;
  description?: string;
}

/**
 * The full parsed agent manifest (agent.yaml).
 */
export interface AgentManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license?: string;
  tags?: string[];
  category?: string;
  requires?: {
    claude_cli?: string;
    node?: string;
    os?: string[];
  };
  mcp_servers?: Record<string, MCPServerConfig>;
  secrets?: SecretDeclaration[];
  permissions?: Permission;
  allowed_tools?: string[];
  config?: ConfigOption[];
  examples?: AgentExample[];
}

/**
 * Runtime agent configuration that combines the parsed manifest
 * with additional resolved data needed to execute the agent.
 */
export interface AgentConfig {
  /** The parsed agent.yaml manifest. */
  manifest: AgentManifest;
  /** The system prompt loaded from AGENT.md. */
  systemPrompt: string;
  /** Absolute path to the agent's installation directory. */
  agentDir: string;
}
