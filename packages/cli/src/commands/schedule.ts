import { Command } from 'commander';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Cron } from 'croner';
import { AGENTS_DIR, SCHEDULER_STATE, SCHEDULER_PID, SCHEDULER_LOGS_DIR } from '../config/paths.js';
import { loadScheduleState, saveScheduleState, addAgentToState, removeAgentFromState } from '../scheduler/state.js';
import { isDaemonRunning, startDaemon, stopDaemon, signalDaemon } from '../scheduler/process.js';
import { readLatestLog, readAllLogs } from '../scheduler/log-store.js';
import { agentYamlSchema } from '../schemas/agent-yaml.js';
import { hasSecrets } from '../secrets/store.js';
import { colors } from '../ui/colors.js';
import { parse as parseYaml } from 'yaml';

export const scheduleCommand = new Command('schedule')
  .description('Manage agent schedules')
  .addHelpText('after', `
Examples:
  $ agentx schedule start slack-agent
  $ agentx schedule stop slack-agent
  $ agentx schedule list
  $ agentx schedule logs slack-agent
  $ agentx schedule logs slack-agent --all
  $ agentx schedule resume`);

scheduleCommand
  .command('start')
  .description('Start an agent schedule')
  .argument('<agent>', 'Agent name to schedule')
  .addHelpText('after', `
Examples:
  $ agentx schedule start slack-agent`)
  .action(async (agentName: string) => {
    try {
      // 1. Verify agent exists
      const agentDir = join(AGENTS_DIR, agentName);
      const manifestPath = join(agentDir, 'agent.yaml');
      if (!existsSync(manifestPath)) {
        console.error(colors.error(`Error: Agent "${agentName}" is not installed.`));
        process.exit(1);
      }

      // 2. Load and validate manifest
      const raw = readFileSync(manifestPath, 'utf-8');
      const parsed = parseYaml(raw);
      const manifest = agentYamlSchema.parse(parsed);

      // 3. Verify schedule block exists
      if (!manifest.schedule || manifest.schedule.length === 0) {
        console.error(colors.error(`Error: ${agentName} has no schedule block in agent.yaml`));
        process.exit(1);
      }

      // 4. Verify secrets if needed
      if (manifest.secrets && manifest.secrets.length > 0) {
        const requiredSecrets = manifest.secrets.filter((s) => s.required);
        if (requiredSecrets.length > 0) {
          const configured = await hasSecrets(agentName);
          if (!configured) {
            const names = requiredSecrets.map((s) => s.name).join(', ');
            console.error(colors.error(`Error: Missing required secrets for ${agentName}: ${names}`));
            console.error(`Run: agentx configure ${agentName}`);
            process.exit(1);
          }
        }
      }

      // 5. Write state
      let state = await loadScheduleState(SCHEDULER_STATE);
      state = addAgentToState(state, agentName, manifest.schedule);

      // Compute next run times
      for (const sched of state.agents[agentName].schedules) {
        try {
          const cron = new Cron(sched.cron);
          const next = cron.nextRun();
          if (next) {
            sched.nextRunAt = next.toISOString();
          }
        } catch {
          // ignore cron error
        }
      }

      await saveScheduleState(state, SCHEDULER_STATE);

      // 6. Start or signal daemon
      if (isDaemonRunning(SCHEDULER_PID)) {
        signalDaemon('SIGHUP', SCHEDULER_PID);
      } else {
        startDaemon(SCHEDULER_PID, SCHEDULER_STATE, SCHEDULER_LOGS_DIR);
      }

      // 7. Print confirmation
      console.log(colors.success(`Schedule started for ${colors.bold(agentName)}`));
      for (const sched of state.agents[agentName].schedules) {
        const nextStr = sched.nextRunAt
          ? new Date(sched.nextRunAt).toLocaleString()
          : 'unknown';
        console.log(`  ${colors.cyan(sched.name)}  ${colors.dim(sched.cron)}  ${colors.dim(`(next: ${nextStr})`)}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });

scheduleCommand
  .command('stop')
  .description('Stop an agent schedule')
  .argument('<agent>', 'Agent name to stop')
  .addHelpText('after', `
Examples:
  $ agentx schedule stop slack-agent`)
  .action(async (agentName: string) => {
    try {
      let state = await loadScheduleState(SCHEDULER_STATE);

      if (!state.agents[agentName]) {
        console.error(colors.error(`Error: ${agentName} has no active schedule`));
        console.error(`Run: agentx schedule list`);
        process.exit(1);
      }

      state = removeAgentFromState(state, agentName);
      await saveScheduleState(state, SCHEDULER_STATE);

      if (Object.keys(state.agents).length === 0) {
        stopDaemon(SCHEDULER_PID);
        console.log(colors.success(`Schedule stopped for ${colors.bold(agentName)}`));
        console.log(colors.dim('Scheduler daemon shut down (no active schedules)'));
      } else {
        signalDaemon('SIGHUP', SCHEDULER_PID);
        console.log(colors.success(`Schedule stopped for ${colors.bold(agentName)}`));
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });

scheduleCommand
  .command('list')
  .description('List all active schedules')
  .addHelpText('after', `
Examples:
  $ agentx schedule list`)
  .action(async () => {
    try {
      const state = await loadScheduleState(SCHEDULER_STATE);
      const agents = Object.values(state.agents);

      if (agents.length === 0) {
        console.log('No active schedules.');
        console.log(colors.dim('Start one with: agentx schedule start <agent-name>'));
        return;
      }

      // Print header
      const header = [
        'Agent'.padEnd(20),
        'Schedule'.padEnd(18),
        'Status'.padEnd(10),
        'Last Run'.padEnd(24),
        'Next Run',
      ].join('');
      console.log(colors.bold(header));

      for (const agent of agents) {
        for (const sched of agent.schedules) {
          const lastRun = sched.lastRunAt
            ? new Date(sched.lastRunAt).toLocaleString()
            : '-';
          const nextRun = sched.nextRunAt
            ? new Date(sched.nextRunAt).toLocaleString()
            : '-';
          const statusColor = sched.status === 'errored' ? colors.error : sched.status === 'running' ? colors.warn : colors.success;

          const row = [
            agent.agentName.padEnd(20),
            sched.cron.padEnd(18),
            statusColor(sched.status.padEnd(10)),
            lastRun.padEnd(24),
            nextRun,
          ].join('');
          console.log(row);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });

scheduleCommand
  .command('logs')
  .description('View execution logs for a scheduled agent')
  .argument('<agent>', 'Agent name')
  .option('--all', 'Show summary of all past runs')
  .addHelpText('after', `
Examples:
  $ agentx schedule logs slack-agent
  $ agentx schedule logs slack-agent --all`)
  .action(async (agentName: string, options: { all?: boolean }) => {
    try {
      if (options.all) {
        const logs = await readAllLogs(agentName, SCHEDULER_LOGS_DIR);
        if (logs.length === 0) {
          console.log(`No runs recorded for ${agentName}.`);
          return;
        }

        const header = [
          'Time'.padEnd(24),
          'Schedule'.padEnd(18),
          'Status'.padEnd(10),
          'Duration',
        ].join('');
        console.log(colors.bold(header));

        for (const log of logs) {
          const time = new Date(log.timestamp).toLocaleString();
          const statusColor = log.status === 'failure' ? colors.error : colors.success;
          const dur = `${(log.duration / 1000).toFixed(1)}s`;
          const row = [
            time.padEnd(24),
            log.scheduleName.padEnd(18),
            statusColor(log.status.padEnd(10)),
            dur,
          ].join('');
          console.log(row);
        }
      } else {
        const log = await readLatestLog(agentName, SCHEDULER_LOGS_DIR);
        if (!log) {
          console.log(`No runs recorded for ${agentName}.`);
          return;
        }

        const statusColor = log.status === 'failure' ? colors.error : colors.success;
        console.log(`Last run: ${new Date(log.timestamp).toLocaleString()} (${log.scheduleName})`);
        console.log(`Status:   ${statusColor(log.status)}`);
        console.log(`Duration: ${(log.duration / 1000).toFixed(1)}s`);
        console.log(`Prompt:   ${log.prompt}`);
        console.log('');
        if (log.output) {
          console.log('Output:');
          console.log(`  ${log.output.split('\n').join('\n  ')}`);
        }
        if (log.status === 'failure' && log.error) {
          console.log('');
          console.log(colors.error(`Error: ${log.error}`));
        }
        if (log.stderr) {
          console.log(colors.dim(`Stderr: ${log.stderr}`));
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });

scheduleCommand
  .command('resume')
  .description('Resume all previously active schedules')
  .addHelpText('after', `
Examples:
  $ agentx schedule resume`)
  .action(async () => {
    try {
      const state = await loadScheduleState(SCHEDULER_STATE);
      const agents = Object.values(state.agents);

      if (agents.length === 0) {
        console.log('No schedules to resume.');
        console.log(colors.dim('Start one with: agentx schedule start <agent-name>'));
        return;
      }

      // Re-compute next run times
      for (const agent of agents) {
        for (const sched of agent.schedules) {
          try {
            const cron = new Cron(sched.cron);
            const next = cron.nextRun();
            if (next) {
              sched.nextRunAt = next.toISOString();
            }
          } catch {
            // ignore
          }
          // Reset status for errored schedules
          if (sched.status === 'errored') {
            sched.status = 'active';
          }
        }
      }

      await saveScheduleState(state, SCHEDULER_STATE);

      if (isDaemonRunning(SCHEDULER_PID)) {
        signalDaemon('SIGHUP', SCHEDULER_PID);
        console.log(colors.success('Scheduler daemon reloaded.'));
      } else {
        startDaemon(SCHEDULER_PID, SCHEDULER_STATE, SCHEDULER_LOGS_DIR);
        console.log(colors.success('Scheduler daemon started.'));
      }

      console.log(`Resumed ${agents.length} agent(s):`);
      for (const agent of agents) {
        console.log(`  ${colors.cyan(agent.agentName)} (${agent.schedules.length} schedule(s))`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(colors.error(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
