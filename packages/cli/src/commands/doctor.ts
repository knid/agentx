import { Command } from 'commander';
import { execa } from 'execa';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { colors } from '../ui/colors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ClaudeCLICheck {
  found: boolean;
  version?: string;
  path?: string;
}

export interface NodeVersionCheck {
  version: string;
  supported: boolean;
}

export interface AgentxVersionCheck {
  version: string;
}

export interface DoctorCheckResult {
  label: string;
  pass: boolean;
  detail: string;
}

export async function checkClaudeCLI(): Promise<ClaudeCLICheck> {
  try {
    const whichResult = await execa('which', ['claude']);
    if (!whichResult.stdout || whichResult.exitCode !== 0) {
      return { found: false };
    }

    const claudePath = whichResult.stdout.trim();

    try {
      const versionResult = await execa('claude', ['--version']);
      return {
        found: true,
        version: versionResult.stdout.trim(),
        path: claudePath,
      };
    } catch {
      return { found: true, path: claudePath };
    }
  } catch {
    return { found: false };
  }
}

export function checkNodeVersion(): NodeVersionCheck {
  const version = process.version.replace(/^v/, '');
  const major = parseInt(version.split('.')[0], 10);
  return {
    version,
    supported: major >= 18,
  };
}

export function checkAgentxVersion(): AgentxVersionCheck {
  // Try multiple paths to handle both source (src/commands/) and bundled (dist/) layouts
  const candidates = [
    join(__dirname, '..', '..', 'package.json'),
    join(__dirname, '..', 'package.json'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const pkg = JSON.parse(readFileSync(candidate, 'utf-8'));
      return { version: pkg.version };
    }
  }
  return { version: 'unknown' };
}

export async function runDoctor(): Promise<DoctorCheckResult[]> {
  const results: DoctorCheckResult[] = [];

  const claudeCheck = await checkClaudeCLI();
  results.push({
    label: 'Claude CLI',
    pass: claudeCheck.found,
    detail: claudeCheck.found
      ? `found (v${claudeCheck.version ?? 'unknown'})`
      : 'not found - install with: npm install -g @anthropic-ai/claude-code',
  });

  const nodeCheck = checkNodeVersion();
  results.push({
    label: 'Node.js',
    pass: nodeCheck.supported,
    detail: nodeCheck.supported
      ? `v${nodeCheck.version}`
      : `v${nodeCheck.version} (requires >= 18)`,
  });

  const agentxCheck = checkAgentxVersion();
  results.push({
    label: 'agentx',
    pass: true,
    detail: `v${agentxCheck.version}`,
  });

  return results;
}

export const doctorCommand = new Command('doctor')
  .description('Check system requirements and configuration')
  .addHelpText('after', `
Examples:
  $ agentx doctor`)
  .action(async () => {
    const results = await runDoctor();
    const allPassed = results.every((r) => r.pass);

    for (const result of results) {
      const icon = result.pass ? colors.success('  ') : colors.error('  ');
      console.log(`${icon} ${result.label}: ${result.detail}`);
    }

    console.log();
    if (allPassed) {
      console.log(colors.success('  agentx ready!'));
    } else {
      console.log(colors.error('  Some checks failed. Please fix the issues above.'));
      process.exit(1);
    }
  });
