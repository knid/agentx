import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

export interface RunLog {
  timestamp: string;
  agentName: string;
  scheduleName: string;
  cron: string;
  prompt: string;
  output: string;
  stderr: string;
  status: 'success' | 'failure';
  duration: number;
  error: string | null;
  retryAttempt: number;
  skipped: boolean;
}

const MAX_LOG_FILES = 50;

function getAgentLogDir(agentName: string, logsDir: string): string {
  return join(logsDir, agentName);
}

function timestampToFilename(timestamp: string): string {
  return timestamp.replace(/:/g, '-') + '.json';
}

export async function writeRunLog(log: RunLog, logsDir: string): Promise<void> {
  const agentDir = getAgentLogDir(log.agentName, logsDir);
  mkdirSync(agentDir, { recursive: true });
  const filename = timestampToFilename(log.timestamp);
  const filePath = join(agentDir, filename);
  writeFileSync(filePath, JSON.stringify(log, null, 2), 'utf-8');
}

export async function readLatestLog(agentName: string, logsDir: string): Promise<RunLog | null> {
  const agentDir = getAgentLogDir(agentName, logsDir);
  if (!existsSync(agentDir)) {
    return null;
  }
  const files = readdirSync(agentDir).filter((f) => f.endsWith('.json')).sort();
  if (files.length === 0) {
    return null;
  }
  const latest = files[files.length - 1];
  const raw = readFileSync(join(agentDir, latest), 'utf-8');
  return JSON.parse(raw) as RunLog;
}

export async function readAllLogs(agentName: string, logsDir: string): Promise<RunLog[]> {
  const agentDir = getAgentLogDir(agentName, logsDir);
  if (!existsSync(agentDir)) {
    return [];
  }
  const files = readdirSync(agentDir).filter((f) => f.endsWith('.json')).sort().reverse();
  return files.map((f) => JSON.parse(readFileSync(join(agentDir, f), 'utf-8')) as RunLog);
}

export async function rotateLogs(agentName: string, logsDir: string): Promise<void> {
  const agentDir = getAgentLogDir(agentName, logsDir);
  if (!existsSync(agentDir)) {
    return;
  }
  const files = readdirSync(agentDir).filter((f) => f.endsWith('.json')).sort();
  if (files.length <= MAX_LOG_FILES) {
    return;
  }
  const toDelete = files.slice(0, files.length - MAX_LOG_FILES);
  for (const f of toDelete) {
    unlinkSync(join(agentDir, f));
  }
}
