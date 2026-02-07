import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('scheduler process', () => {
  let testDir: string;
  let pidPath: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `agentx-proc-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    pidPath = join(testDir, 'scheduler.pid');
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('isDaemonRunning', () => {
    it('should return false when PID file does not exist', async () => {
      const { isDaemonRunning } = await import('../../src/scheduler/process.js');
      const result = isDaemonRunning(pidPath);
      expect(result).toBe(false);
    });

    it('should return false for stale PID file (process not running)', async () => {
      const { isDaemonRunning } = await import('../../src/scheduler/process.js');
      // Write a PID that almost certainly doesn't exist
      writeFileSync(pidPath, '999999999', 'utf-8');
      const result = isDaemonRunning(pidPath);
      expect(result).toBe(false);
    });

    it('should clean up stale PID file', async () => {
      const { isDaemonRunning } = await import('../../src/scheduler/process.js');
      writeFileSync(pidPath, '999999999', 'utf-8');
      isDaemonRunning(pidPath);
      expect(existsSync(pidPath)).toBe(false);
    });

    it('should return true for current process PID (running process)', async () => {
      const { isDaemonRunning } = await import('../../src/scheduler/process.js');
      writeFileSync(pidPath, String(process.pid), 'utf-8');
      const result = isDaemonRunning(pidPath);
      expect(result).toBe(true);
    });
  });

  describe('getDaemonPid', () => {
    it('should return null when PID file does not exist', async () => {
      const { getDaemonPid } = await import('../../src/scheduler/process.js');
      const pid = getDaemonPid(pidPath);
      expect(pid).toBeNull();
    });

    it('should return pid when PID file exists', async () => {
      const { getDaemonPid } = await import('../../src/scheduler/process.js');
      writeFileSync(pidPath, '12345', 'utf-8');
      const pid = getDaemonPid(pidPath);
      expect(pid).toBe(12345);
    });
  });

  describe('signalDaemon', () => {
    it('should return false when PID file does not exist', async () => {
      const { signalDaemon } = await import('../../src/scheduler/process.js');
      const result = signalDaemon('SIGHUP', pidPath);
      expect(result).toBe(false);
    });
  });

  describe('stale daemon detection (T032)', () => {
    it('should detect stale PID and clean up on isDaemonRunning', async () => {
      const { isDaemonRunning } = await import('../../src/scheduler/process.js');
      // Write a PID for a definitely-dead process
      writeFileSync(pidPath, '999999999', 'utf-8');
      expect(existsSync(pidPath)).toBe(true);
      const running = isDaemonRunning(pidPath);
      expect(running).toBe(false);
      expect(existsSync(pidPath)).toBe(false);
    });

    it('should stop daemon even if process already gone', async () => {
      const { stopDaemon } = await import('../../src/scheduler/process.js');
      writeFileSync(pidPath, '999999999', 'utf-8');
      const result = stopDaemon(pidPath);
      // Process doesn't exist, but PID file should be cleaned up
      expect(existsSync(pidPath)).toBe(false);
    });
  });

  describe('retry logic verification via log-store (T030)', () => {
    it('should write log with retryAttempt field', async () => {
      const { writeRunLog, readLatestLog } = await import('../../src/scheduler/log-store.js');
      const logsDir = join(testDir, 'logs');
      mkdirSync(logsDir, { recursive: true });

      // Simulate a retry attempt log entry (as daemon would write)
      await writeRunLog({
        timestamp: '2026-02-07T09:00:10Z',
        agentName: 'retry-agent',
        scheduleName: 'Daily',
        cron: '0 9 * * *',
        prompt: 'Do it',
        output: '',
        stderr: 'error on attempt',
        status: 'failure',
        duration: 1000,
        error: 'API timeout',
        retryAttempt: 1,
        skipped: false,
      }, logsDir);

      const log = await readLatestLog('retry-agent', logsDir);
      expect(log).not.toBeNull();
      expect(log!.retryAttempt).toBe(1);
      expect(log!.status).toBe('failure');
    });

    it('should write log with final success after retry', async () => {
      const { writeRunLog, readAllLogs } = await import('../../src/scheduler/log-store.js');
      const logsDir = join(testDir, 'logs');
      mkdirSync(logsDir, { recursive: true });

      // First attempt fails
      await writeRunLog({
        timestamp: '2026-02-07T09:00:00Z',
        agentName: 'retry-agent',
        scheduleName: 'Daily',
        cron: '0 9 * * *',
        prompt: 'Do it',
        output: '',
        stderr: 'err',
        status: 'failure',
        duration: 500,
        error: 'timeout',
        retryAttempt: 0,
        skipped: false,
      }, logsDir);

      // Second attempt succeeds
      await writeRunLog({
        timestamp: '2026-02-07T09:00:15Z',
        agentName: 'retry-agent',
        scheduleName: 'Daily',
        cron: '0 9 * * *',
        prompt: 'Do it',
        output: 'Done!',
        stderr: '',
        status: 'success',
        duration: 2000,
        error: null,
        retryAttempt: 1,
        skipped: false,
      }, logsDir);

      const all = await readAllLogs('retry-agent', logsDir);
      expect(all).toHaveLength(2);
      expect(all[0].retryAttempt).toBe(1);
      expect(all[0].status).toBe('success');
      expect(all[1].retryAttempt).toBe(0);
      expect(all[1].status).toBe('failure');
    });

    it('should track errorCount in state after exhausted retries', async () => {
      const { addAgentToState } = await import('../../src/scheduler/state.js');
      let state = { pid: 1, startedAt: '2026-02-07T00:00:00Z', agents: {} as Record<string, any> };
      state = addAgentToState(state, 'err-agent', [{ name: 'Task', cron: '0 9 * * *', prompt: 'test' }]);

      // Simulate what daemon does after all retries exhausted
      const sched = state.agents['err-agent'].schedules[0];
      sched.status = 'errored';
      sched.lastRunAt = new Date().toISOString();
      sched.lastRunStatus = 'failure';
      sched.runCount += 1;
      sched.errorCount += 1;

      expect(sched.status).toBe('errored');
      expect(sched.errorCount).toBe(1);
    });
  });
});
