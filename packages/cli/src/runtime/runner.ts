import { execa } from 'execa';
import { unlinkSync, existsSync, readFileSync } from 'node:fs';
import { loadAgentConfig } from '../config/agent-config.js';
import { loadGlobalConfig } from '../config/global-config.js';
import { processSystemPrompt } from './prompt-processor.js';
import { resolveMCPConfig, writeTempMCPConfig } from './mcp-builder.js';
import { detectPipedInput, readPipedInput, buildPromptWithPipe } from './pipe-handler.js';
import { formatOutput } from './output-formatter.js';

export interface ClaudeArgsOptions {
  prompt?: string;
  systemPrompt: string;
  mcpConfigPath?: string;
  maxTurns?: number;
  outputFormat?: 'text' | 'json';
  interactive?: boolean;
}

export interface RunOptions {
  prompt?: string;
  interactive?: boolean;
  file?: string;
  outputFormat?: 'text' | 'json';
  quiet?: boolean;
  debug?: boolean;
  configOverrides?: Record<string, string>;
}

/**
 * Build the argument array for the claude CLI subprocess.
 */
export function buildClaudeArgs(options: ClaudeArgsOptions): string[] {
  const args: string[] = [];

  if (!options.interactive && options.prompt) {
    args.push('-p', options.prompt);
  }

  args.push('--system-prompt', options.systemPrompt);

  if (options.mcpConfigPath) {
    args.push('--mcp-config', options.mcpConfigPath);
  }

  if (options.maxTurns !== undefined) {
    args.push('--max-turns', String(options.maxTurns));
  }

  if (options.outputFormat) {
    args.push('--output-format', options.outputFormat);
  }

  return args;
}

/**
 * Run an agent by name: load config, resolve secrets/MCP, spawn claude CLI.
 */
export async function runAgent(
  agentName: string,
  options: RunOptions,
): Promise<string> {
  // Load agent config (throws AgentNotFoundError if missing)
  const agentConfig = loadAgentConfig(agentName);
  const globalConfig = loadGlobalConfig();
  const { manifest, systemPrompt, agentDir } = agentConfig;

  // Process system prompt template
  const processedPrompt = processSystemPrompt(
    systemPrompt,
    manifest.config ?? [],
    options.configOverrides ?? {},
  );

  // Resolve MCP config with secrets
  let mcpConfigPath: string | undefined;
  if (manifest.mcp_servers && Object.keys(manifest.mcp_servers).length > 0) {
    // For now, secrets are empty until the secrets module is implemented
    const secrets: Record<string, string> = {};
    const resolved = resolveMCPConfig(manifest.mcp_servers, secrets);
    mcpConfigPath = await writeTempMCPConfig(resolved);
  }

  try {
    // Build prompt with pipe support
    let finalPrompt = options.prompt ?? '';
    if (!options.interactive) {
      const isPiped = await detectPipedInput();
      if (isPiped) {
        const pipedContent = await readPipedInput();
        finalPrompt = buildPromptWithPipe(finalPrompt, pipedContent);
      }

      // Append file content if --file specified
      if (options.file) {
        const fileContent = readFileSync(options.file, 'utf-8');
        finalPrompt = buildPromptWithPipe(finalPrompt, fileContent);
      }
    }

    // Build claude CLI args
    const claudeArgs = buildClaudeArgs({
      prompt: options.interactive ? undefined : finalPrompt,
      systemPrompt: processedPrompt,
      mcpConfigPath,
      maxTurns: globalConfig.claude_defaults.max_turns,
      outputFormat: options.outputFormat ?? (globalConfig.default_output as 'text' | 'json'),
      interactive: options.interactive,
    });

    if (options.debug) {
      console.error(`[debug] claude ${claudeArgs.join(' ')}`);
    }

    // Spawn claude CLI
    const claudePath = globalConfig.claude_path;

    if (options.interactive) {
      // Interactive mode: inherit stdio
      await execa(claudePath, claudeArgs, { stdio: 'inherit' });
      return '';
    }

    // Non-interactive mode: capture output
    const result = await execa(claudePath, claudeArgs);
    const output = formatOutput(result.stdout, options.outputFormat ?? 'text');

    if (!options.quiet) {
      process.stdout.write(output);
    }

    return output;
  } finally {
    // Cleanup temp MCP config
    if (mcpConfigPath && existsSync(mcpConfigPath)) {
      try {
        unlinkSync(mcpConfigPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
