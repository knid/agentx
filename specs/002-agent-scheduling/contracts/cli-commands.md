# CLI Command Contracts: Agent Scheduling

**Feature**: 002-agent-scheduling
**Date**: 2026-02-07

## Command: `agentx schedule start <agent-name>`

**Description**: Register an agent's declared schedules with the shared scheduler daemon.

**Arguments**:
| Arg | Type | Required | Description |
|-----|------|----------|-------------|
| `agent-name` | string | Yes | Name of an installed agent with a `schedule` block |

**Preconditions**:
1. Agent must be installed (`~/.agentx/agents/<agent-name>/agent.yaml` exists)
2. Agent manifest must have a `schedule` block with at least one entry
3. All required secrets must be configured
4. If daemon is already running with this agent, inform user and offer restart

**Behavior**:
1. Load and validate agent manifest
2. Verify secrets are configured
3. Write/update `~/.agentx/scheduler/state.json` with agent's schedules
4. If daemon not running → fork daemon process, write PID file
5. If daemon running → send SIGHUP to reload state
6. Print confirmation: agent name, schedule(s) in human-readable form, next run time(s)

**Output (success)**:
```
Schedule started for slack-agent
  Daily standup  0 9 * * 1-5  (next: Mon Feb 10 09:00 AM)
  Weekly summary 0 17 * * 5   (next: Fri Feb 14 05:00 PM)
```

**Output (error — no schedule)**:
```
Error: slack-agent has no schedule block in agent.yaml
```

**Output (error — missing secrets)**:
```
Error: Missing required secrets for slack-agent: SLACK_BOT_TOKEN
Run: agentx configure slack-agent
```

**Exit codes**: 0 = success, 1 = error

---

## Command: `agentx schedule stop <agent-name>`

**Description**: Unregister an agent's schedules from the daemon.

**Arguments**:
| Arg | Type | Required | Description |
|-----|------|----------|-------------|
| `agent-name` | string | Yes | Name of a currently scheduled agent |

**Behavior**:
1. Read state.json, verify agent is registered
2. Remove agent from state.json
3. If schedules remain → send SIGHUP to daemon to reload
4. If no schedules remain → send SIGTERM to daemon, delete PID file
5. Print confirmation

**Output (success)**:
```
Schedule stopped for slack-agent
```

**Output (success — daemon shutdown)**:
```
Schedule stopped for slack-agent
Scheduler daemon shut down (no active schedules)
```

**Output (error — not scheduled)**:
```
Error: slack-agent has no active schedule
Run: agentx schedule list
```

**Exit codes**: 0 = success, 1 = error

---

## Command: `agentx schedule list`

**Description**: Display all active and recently errored schedules.

**Arguments**: None

**Options**: None

**Behavior**:
1. Read `~/.agentx/scheduler/state.json`
2. For each registered agent, compute next run from cron
3. Display formatted table

**Output (with active schedules)**:
```
Agent                Schedule          Status   Last Run              Next Run
slack-agent          0 9 * * 1-5      active   2026-02-07 09:00 AM   2026-02-10 09:00 AM
slack-agent          0 17 * * 5       active   2026-02-07 05:00 PM   2026-02-14 05:00 PM
github-agent         0 8 * * *        errored  2026-02-07 08:00 AM   2026-02-08 08:00 AM
```

**Output (no schedules)**:
```
No active schedules.
Start one with: agentx schedule start <agent-name>
```

**Exit codes**: 0 = success

---

## Command: `agentx schedule logs <agent-name>`

**Description**: View execution logs for a scheduled agent.

**Arguments**:
| Arg | Type | Required | Description |
|-----|------|----------|-------------|
| `agent-name` | string | Yes | Name of a scheduled agent |

**Options**:
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--all` | boolean | false | Show summary of all past runs instead of latest run details |

**Behavior (default — latest run)**:
1. Find newest log file in `~/.agentx/scheduler/logs/<agent-name>/`
2. Display: timestamp, schedule name, prompt, full output, status, duration

**Output (latest run)**:
```
Last run: 2026-02-07 09:00:12 AM (Daily standup)
Status:   success
Duration: 12.3s
Prompt:   Post the daily standup to #engineering

Output:
  Posted standup message to #engineering with 5 team updates.
```

**Behavior (--all)**:
1. Read all log files in agent's log directory
2. Display summary table sorted by time (newest first)

**Output (--all)**:
```
Time                   Schedule          Status    Duration
2026-02-07 09:00 AM    Daily standup     success   12.3s
2026-02-06 09:00 AM    Daily standup     success   11.8s
2026-02-05 09:00 AM    Daily standup     failure   3.1s
2026-02-04 09:00 AM    Daily standup     success   14.2s
```

**Output (no runs)**:
```
No runs recorded for slack-agent.
```

**Exit codes**: 0 = success, 1 = agent not found
