import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('scheduler state', () => {
  let testDir: string;
  let statePath: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `agentx-state-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    statePath = join(testDir, 'state.json');
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('loadScheduleState', () => {
    it('should return empty state when file does not exist', async () => {
      const { loadScheduleState } = await import('../../src/scheduler/state.js');
      const state = await loadScheduleState(statePath);
      expect(state).toEqual({ pid: null, startedAt: null, agents: {} });
    });

    it('should load existing state from file', async () => {
      const { loadScheduleState, saveScheduleState } = await import('../../src/scheduler/state.js');
      const state = {
        pid: 1234,
        startedAt: '2026-02-07T09:00:00Z',
        agents: {
          'slack-agent': {
            agentName: 'slack-agent',
            schedules: [{
              name: 'Daily standup',
              cron: '0 9 * * 1-5',
              prompt: 'Post standup',
              status: 'active' as const,
              lastRunAt: null,
              lastRunStatus: null,
              nextRunAt: null,
              runCount: 0,
              errorCount: 0,
            }],
            registeredAt: '2026-02-07T09:00:00Z',
          },
        },
      };
      await saveScheduleState(state, statePath);
      const loaded = await loadScheduleState(statePath);
      expect(loaded).toEqual(state);
    });
  });

  describe('saveScheduleState', () => {
    it('should create state file with correct permissions', async () => {
      const { saveScheduleState } = await import('../../src/scheduler/state.js');
      await saveScheduleState({ pid: 1, startedAt: null, agents: {} }, statePath);
      expect(existsSync(statePath)).toBe(true);
      const stats = statSync(statePath);
      // 0o600 = owner read/write only
      expect(stats.mode & 0o777).toBe(0o600);
    });

    it('should write valid JSON', async () => {
      const { saveScheduleState } = await import('../../src/scheduler/state.js');
      const state = { pid: 42, startedAt: '2026-02-07T09:00:00Z', agents: {} };
      await saveScheduleState(state, statePath);
      const raw = readFileSync(statePath, 'utf-8');
      expect(JSON.parse(raw)).toEqual(state);
    });
  });

  describe('addAgentToState', () => {
    it('should add a new agent to empty state', async () => {
      const { loadScheduleState, saveScheduleState, addAgentToState } = await import('../../src/scheduler/state.js');
      const state = { pid: 1, startedAt: '2026-02-07T09:00:00Z', agents: {} };
      const schedules = [{ name: 'Test', cron: '0 9 * * *', prompt: 'Do it' }];
      const updated = addAgentToState(state, 'test-agent', schedules);
      expect(updated.agents['test-agent']).toBeDefined();
      expect(updated.agents['test-agent'].agentName).toBe('test-agent');
      expect(updated.agents['test-agent'].schedules).toHaveLength(1);
      expect(updated.agents['test-agent'].schedules[0].status).toBe('active');
    });

    it('should replace existing agent schedules', async () => {
      const { addAgentToState } = await import('../../src/scheduler/state.js');
      const state = {
        pid: 1,
        startedAt: '2026-02-07T09:00:00Z',
        agents: {
          'test-agent': {
            agentName: 'test-agent',
            schedules: [{ name: 'Old', cron: '0 8 * * *', prompt: 'Old task', status: 'active' as const, lastRunAt: null, lastRunStatus: null, nextRunAt: null, runCount: 5, errorCount: 0 }],
            registeredAt: '2026-02-06T09:00:00Z',
          },
        },
      };
      const newSchedules = [{ name: 'New', cron: '0 10 * * *', prompt: 'New task' }];
      const updated = addAgentToState(state, 'test-agent', newSchedules);
      expect(updated.agents['test-agent'].schedules).toHaveLength(1);
      expect(updated.agents['test-agent'].schedules[0].name).toBe('New');
    });
  });

  describe('removeAgentFromState', () => {
    it('should remove agent from state', async () => {
      const { removeAgentFromState } = await import('../../src/scheduler/state.js');
      const state = {
        pid: 1,
        startedAt: '2026-02-07T09:00:00Z',
        agents: {
          'test-agent': {
            agentName: 'test-agent',
            schedules: [],
            registeredAt: '2026-02-07T09:00:00Z',
          },
        },
      };
      const updated = removeAgentFromState(state, 'test-agent');
      expect(updated.agents['test-agent']).toBeUndefined();
    });

    it('should not error when removing non-existent agent', async () => {
      const { removeAgentFromState } = await import('../../src/scheduler/state.js');
      const state = { pid: 1, startedAt: null, agents: {} };
      const updated = removeAgentFromState(state, 'ghost-agent');
      expect(Object.keys(updated.agents)).toHaveLength(0);
    });
  });
});
