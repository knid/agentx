import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('scheduler log-store', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `agentx-log-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('writeRunLog', () => {
    it('should write a log file to agent log directory', async () => {
      const { writeRunLog } = await import('../../src/scheduler/log-store.js');
      const log = {
        timestamp: '2026-02-07T09:00:00Z',
        agentName: 'test-agent',
        scheduleName: 'Daily',
        cron: '0 9 * * *',
        prompt: 'Do it',
        output: 'Done!',
        stderr: '',
        status: 'success' as const,
        duration: 1234,
        error: null,
        retryAttempt: 0,
        skipped: false,
      };
      await writeRunLog(log, testDir);
      const agentDir = join(testDir, 'test-agent');
      const files = readdirSync(agentDir);
      expect(files).toHaveLength(1);
      expect(files[0]).toMatch(/\.json$/);
    });

    it('should create agent log directory if it does not exist', async () => {
      const { writeRunLog } = await import('../../src/scheduler/log-store.js');
      const log = {
        timestamp: '2026-02-07T09:00:00Z',
        agentName: 'new-agent',
        scheduleName: 'Test',
        cron: '0 9 * * *',
        prompt: 'test',
        output: '',
        stderr: '',
        status: 'success' as const,
        duration: 100,
        error: null,
        retryAttempt: 0,
        skipped: false,
      };
      await writeRunLog(log, testDir);
      const agentDir = join(testDir, 'new-agent');
      expect(readdirSync(agentDir)).toHaveLength(1);
    });
  });

  describe('readLatestLog', () => {
    it('should return the most recent log file', async () => {
      const { writeRunLog, readLatestLog } = await import('../../src/scheduler/log-store.js');
      const baselog = {
        agentName: 'test-agent',
        scheduleName: 'Daily',
        cron: '0 9 * * *',
        prompt: 'Do it',
        stderr: '',
        error: null,
        retryAttempt: 0,
        skipped: false,
      };
      await writeRunLog({ ...baselog, timestamp: '2026-02-05T09:00:00Z', output: 'First', status: 'success' as const, duration: 100 }, testDir);
      await writeRunLog({ ...baselog, timestamp: '2026-02-06T09:00:00Z', output: 'Second', status: 'success' as const, duration: 200 }, testDir);
      await writeRunLog({ ...baselog, timestamp: '2026-02-07T09:00:00Z', output: 'Third', status: 'failure' as const, duration: 300 }, testDir);

      const latest = await readLatestLog('test-agent', testDir);
      expect(latest).not.toBeNull();
      expect(latest!.output).toBe('Third');
      expect(latest!.status).toBe('failure');
    });

    it('should return null when no logs exist', async () => {
      const { readLatestLog } = await import('../../src/scheduler/log-store.js');
      const result = await readLatestLog('nonexistent-agent', testDir);
      expect(result).toBeNull();
    });
  });

  describe('readAllLogs', () => {
    it('should return all logs sorted newest first', async () => {
      const { writeRunLog, readAllLogs } = await import('../../src/scheduler/log-store.js');
      const baselog = {
        agentName: 'test-agent',
        scheduleName: 'Daily',
        cron: '0 9 * * *',
        prompt: 'Do it',
        stderr: '',
        error: null,
        retryAttempt: 0,
        skipped: false,
      };
      await writeRunLog({ ...baselog, timestamp: '2026-02-05T09:00:00Z', output: 'A', status: 'success' as const, duration: 100 }, testDir);
      await writeRunLog({ ...baselog, timestamp: '2026-02-07T09:00:00Z', output: 'C', status: 'success' as const, duration: 300 }, testDir);
      await writeRunLog({ ...baselog, timestamp: '2026-02-06T09:00:00Z', output: 'B', status: 'success' as const, duration: 200 }, testDir);

      const all = await readAllLogs('test-agent', testDir);
      expect(all).toHaveLength(3);
      expect(all[0].output).toBe('C');
      expect(all[1].output).toBe('B');
      expect(all[2].output).toBe('A');
    });

    it('should return empty array when no logs exist', async () => {
      const { readAllLogs } = await import('../../src/scheduler/log-store.js');
      const result = await readAllLogs('nonexistent-agent', testDir);
      expect(result).toEqual([]);
    });
  });

  describe('rotateLogs', () => {
    it('should keep only the last 50 log files', async () => {
      const { writeRunLog, rotateLogs } = await import('../../src/scheduler/log-store.js');
      const baselog = {
        agentName: 'test-agent',
        scheduleName: 'Daily',
        cron: '0 9 * * *',
        prompt: 'Do it',
        output: 'ok',
        stderr: '',
        status: 'success' as const,
        duration: 100,
        error: null,
        retryAttempt: 0,
        skipped: false,
      };

      // Write 55 log files
      for (let i = 0; i < 55; i++) {
        const d = new Date(2026, 0, 1, 0, i, 0);
        await writeRunLog({ ...baselog, timestamp: d.toISOString() }, testDir);
      }

      const agentDir = join(testDir, 'test-agent');
      expect(readdirSync(agentDir).length).toBe(55);

      await rotateLogs('test-agent', testDir);
      expect(readdirSync(agentDir).length).toBe(50);
    });

    it('should not delete files when under limit', async () => {
      const { writeRunLog, rotateLogs } = await import('../../src/scheduler/log-store.js');
      await writeRunLog({
        timestamp: '2026-02-07T09:00:00Z',
        agentName: 'test-agent',
        scheduleName: 'Daily',
        cron: '0 9 * * *',
        prompt: 'Do it',
        output: 'ok',
        stderr: '',
        status: 'success' as const,
        duration: 100,
        error: null,
        retryAttempt: 0,
        skipped: false,
      }, testDir);

      await rotateLogs('test-agent', testDir);
      const agentDir = join(testDir, 'test-agent');
      expect(readdirSync(agentDir).length).toBe(1);
    });
  });
});
