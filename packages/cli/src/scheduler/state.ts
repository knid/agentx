import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

export interface ScheduleRunState {
  name: string;
  cron: string;
  prompt: string;
  status: 'active' | 'running' | 'errored';
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'failure' | null;
  nextRunAt: string | null;
  runCount: number;
  errorCount: number;
}

export interface AgentScheduleState {
  agentName: string;
  schedules: ScheduleRunState[];
  registeredAt: string;
}

export interface SchedulerState {
  pid: number | null;
  startedAt: string | null;
  agents: Record<string, AgentScheduleState>;
}

const EMPTY_STATE: SchedulerState = {
  pid: null,
  startedAt: null,
  agents: {},
};

export async function loadScheduleState(statePath: string): Promise<SchedulerState> {
  if (!existsSync(statePath)) {
    return { ...EMPTY_STATE, agents: {} };
  }
  const raw = readFileSync(statePath, 'utf-8');
  return JSON.parse(raw) as SchedulerState;
}

export async function saveScheduleState(state: SchedulerState, statePath: string): Promise<void> {
  const dir = dirname(statePath);
  mkdirSync(dir, { recursive: true });
  // Atomic write: write to temp file then rename
  const tmpPath = join(dir, `.state.${Date.now()}.tmp`);
  writeFileSync(tmpPath, JSON.stringify(state, null, 2), { encoding: 'utf-8', mode: 0o600 });
  renameSync(tmpPath, statePath);
}

export function addAgentToState(
  state: SchedulerState,
  agentName: string,
  schedules: Array<{ name?: string; cron: string; prompt: string }>,
): SchedulerState {
  const scheduleStates: ScheduleRunState[] = schedules.map((s) => ({
    name: s.name ?? s.cron,
    cron: s.cron,
    prompt: s.prompt,
    status: 'active' as const,
    lastRunAt: null,
    lastRunStatus: null,
    nextRunAt: null,
    runCount: 0,
    errorCount: 0,
  }));

  return {
    ...state,
    agents: {
      ...state.agents,
      [agentName]: {
        agentName,
        schedules: scheduleStates,
        registeredAt: new Date().toISOString(),
      },
    },
  };
}

export function removeAgentFromState(state: SchedulerState, agentName: string): SchedulerState {
  const { [agentName]: _, ...remainingAgents } = state.agents;
  return {
    ...state,
    agents: remainingAgents,
  };
}
