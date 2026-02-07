import { Cron } from 'croner';
import { loadScheduleState, saveScheduleState } from './state.js';
import { writeRunLog, rotateLogs } from './log-store.js';
import type { SchedulerState, ScheduleRunState } from './state.js';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const statePath = process.env.AGENTX_SCHEDULER_STATE!;
const pidPath = process.env.AGENTX_SCHEDULER_PID!;
const logsDir = process.env.AGENTX_SCHEDULER_LOGS!;

const activeJobs = new Map<string, Cron[]>();
const runningAgents = new Set<string>();

const RETRY_DELAYS = [10_000, 30_000]; // 10s, 30s

async function executeAgent(
  agentName: string,
  schedule: ScheduleRunState,
  retryAttempt: number = 0,
): Promise<void> {
  const runKey = `${agentName}:${schedule.name}`;

  // Overlap prevention
  if (runningAgents.has(runKey)) {
    await writeRunLog({
      timestamp: new Date().toISOString(),
      agentName,
      scheduleName: schedule.name,
      cron: schedule.cron,
      prompt: schedule.prompt,
      output: '',
      stderr: '',
      status: 'success',
      duration: 0,
      error: null,
      retryAttempt,
      skipped: true,
    }, logsDir);
    return;
  }

  runningAgents.add(runKey);
  const startTime = Date.now();

  // Update state to running
  const state = await loadScheduleState(statePath);
  const agentState = state.agents[agentName];
  if (agentState) {
    const schedState = agentState.schedules.find((s) => s.name === schedule.name);
    if (schedState) {
      schedState.status = 'running';
      await saveScheduleState(state, statePath);
    }
  }

  try {
    const { stdout, stderr } = await execFileAsync('agentx', ['run', agentName, schedule.prompt], {
      timeout: 300_000, // 5 minute timeout
      env: { ...process.env },
    });

    const duration = Date.now() - startTime;

    await writeRunLog({
      timestamp: new Date().toISOString(),
      agentName,
      scheduleName: schedule.name,
      cron: schedule.cron,
      prompt: schedule.prompt,
      output: stdout,
      stderr: stderr || '',
      status: 'success',
      duration,
      error: null,
      retryAttempt,
      skipped: false,
    }, logsDir);

    // Update state: success
    const updatedState = await loadScheduleState(statePath);
    const updAgent = updatedState.agents[agentName];
    if (updAgent) {
      const sched = updAgent.schedules.find((s) => s.name === schedule.name);
      if (sched) {
        sched.status = 'active';
        sched.lastRunAt = new Date().toISOString();
        sched.lastRunStatus = 'success';
        sched.runCount += 1;
        await saveScheduleState(updatedState, statePath);
      }
    }

    await rotateLogs(agentName, logsDir);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errMsg = error instanceof Error ? error.message : String(error);
    const stderr = error && typeof error === 'object' && 'stderr' in error ? String((error as any).stderr) : '';

    await writeRunLog({
      timestamp: new Date().toISOString(),
      agentName,
      scheduleName: schedule.name,
      cron: schedule.cron,
      prompt: schedule.prompt,
      output: '',
      stderr,
      status: 'failure',
      duration,
      error: errMsg,
      retryAttempt,
      skipped: false,
    }, logsDir);

    // Retry logic
    if (retryAttempt < RETRY_DELAYS.length) {
      runningAgents.delete(runKey);
      const delay = RETRY_DELAYS[retryAttempt];
      await new Promise((resolve) => setTimeout(resolve, delay));
      return executeAgent(agentName, schedule, retryAttempt + 1);
    }

    // All retries exhausted — mark as errored
    const updatedState = await loadScheduleState(statePath);
    const updAgent = updatedState.agents[agentName];
    if (updAgent) {
      const sched = updAgent.schedules.find((s) => s.name === schedule.name);
      if (sched) {
        sched.status = 'errored';
        sched.lastRunAt = new Date().toISOString();
        sched.lastRunStatus = 'failure';
        sched.runCount += 1;
        sched.errorCount += 1;
        await saveScheduleState(updatedState, statePath);
      }
    }

    await rotateLogs(agentName, logsDir);
  } finally {
    runningAgents.delete(runKey);
  }
}

function reconcileJobs(state: SchedulerState): void {
  // Stop all existing jobs
  for (const [, jobs] of activeJobs) {
    for (const job of jobs) {
      job.stop();
    }
  }
  activeJobs.clear();

  // Create new jobs from state
  for (const [agentName, agentState] of Object.entries(state.agents)) {
    const jobs: Cron[] = [];
    for (const schedule of agentState.schedules) {
      const job = new Cron(schedule.cron, () => {
        executeAgent(agentName, schedule).catch((err) => {
          console.error(`[scheduler] Error executing ${agentName}/${schedule.name}:`, err);
        });
      });

      // Update next run time in state
      const nextRun = job.nextRun();
      if (nextRun) {
        schedule.nextRunAt = nextRun.toISOString();
      }

      jobs.push(job);
    }
    activeJobs.set(agentName, jobs);
  }

  // Save updated next run times
  saveScheduleState(state, statePath).catch(() => {});
}

async function startup(): Promise<void> {
  // Write PID file
  writeFileSync(pidPath, String(process.pid), { encoding: 'utf-8', mode: 0o600 });

  // Load state and start cron jobs
  const state = await loadScheduleState(statePath);
  state.pid = process.pid;
  state.startedAt = new Date().toISOString();
  await saveScheduleState(state, statePath);

  reconcileJobs(state);
}

// Signal handlers
process.on('SIGHUP', async () => {
  try {
    const state = await loadScheduleState(statePath);
    reconcileJobs(state);
  } catch (err) {
    console.error('[scheduler] Error handling SIGHUP:', err);
  }
});

process.on('SIGTERM', () => {
  // Stop all jobs
  for (const [, jobs] of activeJobs) {
    for (const job of jobs) {
      job.stop();
    }
  }
  activeJobs.clear();

  // Clean up PID file
  if (existsSync(pidPath)) {
    unlinkSync(pidPath);
  }

  process.exit(0);
});

// Start
startup().catch((err) => {
  console.error('[scheduler] Fatal startup error:', err);
  process.exit(1);
});
