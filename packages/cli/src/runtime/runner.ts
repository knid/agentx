import { execa } from 'execa';
import { unlinkSync, existsSync, readFileSync } from 'node:fs';
import { loadAgentConfig } from '../config/agent-config.js';
import { loadGlobalConfig } from '../config/global-config.js';
import { processSystemPrompt } from './prompt-processor.js';
import { resolveMCPConfig, writeTempMCPConfig } from './mcp-builder.js';
import { detectPipedInput, readPipedInput, buildPromptWithPipe } from './pipe-handler.js';
import { printRunHeader, printRunOutput, printRunFooter } from './output-formatter.js';
import { sendTelemetry } from '../telemetry/reporter.js';
import { loadSecrets } from '../secrets/store.js';

export interface ClaudeArgsOptions {
  prompt?: string;
  systemPrompt: string;
  mcpConfigPath?: string;
  maxTurns?: number;
  outputFormat?: 'text' | 'json';
  interactive?: boolean;
  allowedTools?: string[];
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

  if (options.allowedTools && options.allowedTools.length > 0) {
    args.push('--allowedTools', ...options.allowedTools);
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
    const secrets = await loadSecrets(manifest.name);
    const resolved = resolveMCPConfig(manifest.mcp_servers, secrets);
    mcpConfigPath = await writeTempMCPConfig(resolved);
  }

  const startTime = Date.now();
  const agentFullName = `@${manifest.author?.replace(/^@/, '') ?? 'local'}/${manifest.name}`;

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
      allowedTools: manifest.allowed_tools,
    });

    if (options.debug) {
      console.error(`[debug] claude ${claudeArgs.join(' ')}`);
    }

    // Spawn claude CLI
    const claudePath = globalConfig.claude_path;

    if (options.interactive) {
      // Interactive mode: inherit stdio
      await execa(claudePath, claudeArgs, { stdio: 'inherit' });
      sendTelemetry({
        agent: agentFullName,
        version: manifest.version,
        success: true,
        duration_ms: Date.now() - startTime,
      });
      return '';
    }

    // Non-interactive mode: capture stdout, render beautifully
    const outputFormat = options.outputFormat ?? 'text';

    if (!options.quiet) {
      printRunHeader({
        agentName: agentFullName,
        version: manifest.version,
      });
    }

    const result = await execa(claudePath, claudeArgs, {
      stdout: 'pipe',
      stderr: 'inherit',
      stdin: 'inherit',
    });

    const rawOutput = result.stdout ?? '';

    if (!options.quiet) {
      printRunOutput(rawOutput, { format: outputFormat as 'text' | 'json' });
      printRunFooter({ durationMs: Date.now() - startTime });
    } else if (rawOutput) {
      // In quiet mode, still print the raw output without decoration
      console.log(rawOutput);
    }

    sendTelemetry({
      agent: agentFullName,
      version: manifest.version,
      success: true,
      duration_ms: Date.now() - startTime,
    });

    return rawOutput;
  } catch (error) {
    sendTelemetry({
      agent: agentFullName,
      version: manifest.version,
      success: false,
      duration_ms: Date.now() - startTime,
      error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
    });
    throw error;
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
