import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function isDaemonRunning(pidPath: string): boolean {
  if (!existsSync(pidPath)) {
    return false;
  }
  const pid = getDaemonPid(pidPath);
  if (pid === null) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    // Process doesn't exist — stale PID file
    unlinkSync(pidPath);
    return false;
  }
}

export function getDaemonPid(pidPath: string): number | null {
  if (!existsSync(pidPath)) {
    return null;
  }
  const raw = readFileSync(pidPath, 'utf-8').trim();
  const pid = parseInt(raw, 10);
  return isNaN(pid) ? null : pid;
}

export function startDaemon(pidPath: string, statePath: string, logsDir: string): number {
  // Check for stale daemon
  if (existsSync(pidPath)) {
    const pid = getDaemonPid(pidPath);
    if (pid !== null) {
      try {
        process.kill(pid, 0);
        // Already running
        return pid;
      } catch {
        // Stale PID, clean up
        unlinkSync(pidPath);
      }
    }
  }

  const dir = dirname(pidPath);
  mkdirSync(dir, { recursive: true });

  // Resolve daemon script path — try multiple candidates for bundled vs source
  const candidates = [
    join(__dirname, '..', 'scheduler', 'daemon.js'),  // dist/scheduler/daemon.js from dist/index.js
    join(__dirname, 'daemon.js'),                       // same directory
    join(__dirname, '..', 'dist', 'scheduler', 'daemon.js'), // from src/ during dev
  ];
  let daemonScript = candidates[0];
  for (const c of candidates) {
    if (existsSync(c)) {
      daemonScript = c;
      break;
    }
  }

  const child = fork(daemonScript, [], {
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      AGENTX_SCHEDULER_STATE: statePath,
      AGENTX_SCHEDULER_PID: pidPath,
      AGENTX_SCHEDULER_LOGS: logsDir,
    },
  });

  const pid = child.pid!;
  writeFileSync(pidPath, String(pid), { encoding: 'utf-8', mode: 0o600 });
  child.unref();

  return pid;
}

export function stopDaemon(pidPath: string): boolean {
  const pid = getDaemonPid(pidPath);
  if (pid === null) {
    return false;
  }
  try {
    process.kill(pid, 'SIGTERM');
    // Clean up PID file
    if (existsSync(pidPath)) {
      unlinkSync(pidPath);
    }
    return true;
  } catch {
    // Process already gone
    if (existsSync(pidPath)) {
      unlinkSync(pidPath);
    }
    return false;
  }
}

export function signalDaemon(signal: 'SIGHUP' | 'SIGTERM', pidPath: string): boolean {
  const pid = getDaemonPid(pidPath);
  if (pid === null) {
    return false;
  }
  try {
    process.kill(pid, signal);
    return true;
  } catch {
    return false;
  }
}
