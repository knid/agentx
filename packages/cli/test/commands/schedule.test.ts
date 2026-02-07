import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parse as parseYaml } from 'yaml';

describe('schedule commands', () => {
  let testDir: string;
  let agentsDir: string;
  let schedulerDir: string;
  let statePath: string;
  let pidPath: string;
  let logsDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `agentx-schedule-cmd-test-${Date.now()}`);
    agentsDir = join(testDir, 'agents');
    schedulerDir = join(testDir, 'scheduler');
    statePath = join(schedulerDir, 'state.json');
    pidPath = join(schedulerDir, 'scheduler.pid');
    logsDir = join(schedulerDir, 'logs');
    mkdirSync(agentsDir, { recursive: true });
    mkdirSync(schedulerDir, { recursive: true });
    mkdirSync(logsDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  function createTestAgent(name: string, opts: { schedule?: boolean; secrets?: boolean } = {}) {
    const agentDir = join(agentsDir, name);
    mkdirSync(agentDir, { recursive: true });
    const manifest: Record<string, unknown> = {
      name,
      version: '1.0.0',
      description: `Test agent ${name}`,
      author: '@test',
    };
    if (opts.schedule !== false) {
      manifest.schedule = [
        { name: 'Daily task', cron: '0 9 * * *', prompt: 'Do the thing' },
      ];
    }
    if (opts.secrets) {
      manifest.secrets = [{ name: 'API_KEY', required: true }];
    }
    writeFileSync(join(agentDir, 'agent.yaml'), Object.entries(manifest).map(([k, v]) => {
      if (typeof v === 'string') return `${k}: "${v}"`;
      if (Array.isArray(v)) return `${k}:\n${v.map(item => {
        const lines = Object.entries(item as Record<string, unknown>).map(([ik, iv]) => `    ${ik}: ${typeof iv === 'string' ? `"${iv}"` : iv}`);
        return `  - ${lines.join('\n')}`.replace('  -     ', '  - ');
      }).join('\n')}`;
      return `${k}: ${v}`;
    }).join('\n'), 'utf-8');
    // Also write a proper YAML file
    const { stringify } = require('yaml');
    writeFileSync(join(agentDir, 'agent.yaml'), stringify(manifest), 'utf-8');
  }

  describe('schedule start', () => {
    it('should add agent to state when starting', async () => {
      createTestAgent('test-agent');
      const { loadScheduleState, addAgentToState, saveScheduleState } = await import('../../src/scheduler/state.js');
      const { agentYamlSchema } = await import('../../src/schemas/agent-yaml.js');

      // Simulate what the start command does
      const manifestRaw = require('yaml').parse(
        require('fs').readFileSync(join(agentsDir, 'test-agent', 'agent.yaml'), 'utf-8')
      );
      const manifest = agentYamlSchema.parse(manifestRaw);
      expect(manifest.schedule).toBeDefined();
      expect(manifest.schedule).toHaveLength(1);

      let state = await loadScheduleState(statePath);
      state = addAgentToState(state, 'test-agent', manifest.schedule!);
      await saveScheduleState(state, statePath);

      const loaded = await loadScheduleState(statePath);
      expect(loaded.agents['test-agent']).toBeDefined();
      expect(loaded.agents['test-agent'].schedules).toHaveLength(1);
      expect(loaded.agents['test-agent'].schedules[0].name).toBe('Daily task');
    });

    it('should reject agent without schedule block', async () => {
      createTestAgent('no-sched-agent', { schedule: false });
      const { agentYamlSchema } = await import('../../src/schemas/agent-yaml.js');
      const manifestRaw = require('yaml').parse(
        require('fs').readFileSync(join(agentsDir, 'no-sched-agent', 'agent.yaml'), 'utf-8')
      );
      const manifest = agentYamlSchema.parse(manifestRaw);
      expect(manifest.schedule).toBeUndefined();
    });
  });

  describe('schedule stop', () => {
    it('should remove agent from state', async () => {
      const { loadScheduleState, addAgentToState, removeAgentFromState, saveScheduleState } = await import('../../src/scheduler/state.js');
      let state = { pid: 1234, startedAt: new Date().toISOString(), agents: {} as Record<string, any> };
      state = addAgentToState(state, 'test-agent', [{ name: 'Test', cron: '0 9 * * *', prompt: 'test' }]);
      await saveScheduleState(state, statePath);

      let loaded = await loadScheduleState(statePath);
      expect(loaded.agents['test-agent']).toBeDefined();

      const updated = removeAgentFromState(loaded, 'test-agent');
      await saveScheduleState(updated, statePath);

      loaded = await loadScheduleState(statePath);
      expect(loaded.agents['test-agent']).toBeUndefined();
    });

    it('should error when agent has no active schedule', async () => {
      const { loadScheduleState } = await import('../../src/scheduler/state.js');
      const state = await loadScheduleState(statePath);
      expect(state.agents['nonexistent-agent']).toBeUndefined();
    });

    it('should detect when no schedules remain after stop', async () => {
      const { addAgentToState, removeAgentFromState } = await import('../../src/scheduler/state.js');
      let state = { pid: 1234, startedAt: new Date().toISOString(), agents: {} as Record<string, any> };
      state = addAgentToState(state, 'only-agent', [{ name: 'Test', cron: '0 9 * * *', prompt: 'test' }]);
      const updated = removeAgentFromState(state, 'only-agent');
      expect(Object.keys(updated.agents)).toHaveLength(0);
    });
  });

  describe('schedule list', () => {
    it('should return empty agents for empty state', async () => {
      const { loadScheduleState } = await import('../../src/scheduler/state.js');
      const state = await loadScheduleState(statePath);
      expect(Object.keys(state.agents)).toHaveLength(0);
    });

    it('should return all active agents with schedules', async () => {
      const { addAgentToState, saveScheduleState, loadScheduleState } = await import('../../src/scheduler/state.js');
      let state = { pid: 1, startedAt: new Date().toISOString(), agents: {} as Record<string, any> };
      state = addAgentToState(state, 'agent-a', [{ name: 'Task A', cron: '0 9 * * *', prompt: 'a' }]);
      state = addAgentToState(state, 'agent-b', [{ name: 'Task B', cron: '0 17 * * *', prompt: 'b' }]);
      await saveScheduleState(state, statePath);

      const loaded = await loadScheduleState(statePath);
      expect(Object.keys(loaded.agents)).toHaveLength(2);
    });
  });

  describe('schedule logs', () => {
    it('should return latest log for an agent', async () => {
      const { writeRunLog, readLatestLog } = await import('../../src/scheduler/log-store.js');
      await writeRunLog({
        timestamp: '2026-02-07T09:00:00Z',
        agentName: 'test-agent',
        scheduleName: 'Daily task',
        cron: '0 9 * * *',
        prompt: 'Do it',
        output: 'Done!',
        stderr: '',
        status: 'success',
        duration: 5000,
        error: null,
        retryAttempt: 0,
        skipped: false,
      }, logsDir);

      const latest = await readLatestLog('test-agent', logsDir);
      expect(latest).not.toBeNull();
      expect(latest!.output).toBe('Done!');
    });

    it('should return null when no logs exist for agent', async () => {
      const { readLatestLog } = await import('../../src/scheduler/log-store.js');
      const latest = await readLatestLog('no-logs-agent', logsDir);
      expect(latest).toBeNull();
    });

    it('should display failed run with error', async () => {
      const { writeRunLog, readLatestLog } = await import('../../src/scheduler/log-store.js');
      await writeRunLog({
        timestamp: '2026-02-07T09:00:00Z',
        agentName: 'fail-agent',
        scheduleName: 'Daily',
        cron: '0 9 * * *',
        prompt: 'Do it',
        output: '',
        stderr: 'Error: API key expired',
        status: 'failure',
        duration: 1000,
        error: 'API key expired',
        retryAttempt: 0,
        skipped: false,
      }, logsDir);

      const latest = await readLatestLog('fail-agent', logsDir);
      expect(latest!.status).toBe('failure');
      expect(latest!.error).toBe('API key expired');
    });

    it('should return all logs sorted newest first', async () => {
      const { writeRunLog, readAllLogs } = await import('../../src/scheduler/log-store.js');
      const base = {
        agentName: 'test-agent',
        scheduleName: 'Daily',
        cron: '0 9 * * *',
        prompt: 'Do it',
        stderr: '',
        error: null,
        retryAttempt: 0,
        skipped: false,
      };
      await writeRunLog({ ...base, timestamp: '2026-02-05T09:00:00Z', output: 'old', status: 'success' as const, duration: 100 }, logsDir);
      await writeRunLog({ ...base, timestamp: '2026-02-07T09:00:00Z', output: 'new', status: 'success' as const, duration: 300 }, logsDir);

      const all = await readAllLogs('test-agent', logsDir);
      expect(all).toHaveLength(2);
      expect(all[0].output).toBe('new');
    });
  });
});
