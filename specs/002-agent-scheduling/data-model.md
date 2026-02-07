# Data Model: Agent Scheduling

**Feature**: 002-agent-scheduling
**Date**: 2026-02-07

## Entities

### 1. Schedule Entry (in agent.yaml manifest)

Declared by agent authors. Immutable at runtime — changes require manifest update + restart.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Human-readable label (e.g., "Daily standup"). Defaults to cron expression if omitted. |
| `cron` | string | Yes | 5-field cron expression (minute hour day-of-month month day-of-week). Validated via `Cron.isValid()`. |
| `prompt` | string | Yes | The prompt to send to the agent when the schedule fires. Sent verbatim. |

**Validation Rules**:
- `cron` must be a valid 5-field cron expression
- `prompt` must be non-empty, max 2000 characters
- Array max length: 10 entries per agent

**Example**:
```yaml
schedule:
  - name: "Daily standup"
    cron: "0 9 * * 1-5"
    prompt: "Post the daily standup to #engineering"
```

---

### 2. Scheduler State (runtime, persisted to disk)

Managed by the daemon process. Stored at `~/.agentx/scheduler/state.json`.

| Field | Type | Description |
|-------|------|-------------|
| `pid` | number | Daemon process ID |
| `startedAt` | string (ISO 8601) | When the daemon was started |
| `agents` | Record<string, AgentScheduleState> | Map of agent name → schedule state |

**AgentScheduleState**:

| Field | Type | Description |
|-------|------|-------------|
| `agentName` | string | Name of the scheduled agent |
| `schedules` | ScheduleRunState[] | Per-schedule-entry runtime state |
| `registeredAt` | string (ISO 8601) | When this agent was registered with the daemon |

**ScheduleRunState**:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Schedule entry name (from manifest or derived) |
| `cron` | string | Cron expression |
| `prompt` | string | Prompt to send |
| `status` | "active" \| "running" \| "errored" | Current status |
| `lastRunAt` | string (ISO 8601) \| null | Last execution time |
| `lastRunStatus` | "success" \| "failure" \| null | Last execution result |
| `nextRunAt` | string (ISO 8601) \| null | Next scheduled execution |
| `runCount` | number | Total number of executions |
| `errorCount` | number | Total number of failed executions |

**State Transitions**:
```
[not registered] --start--> active --cron fires--> running --success--> active
                                                          --failure--> errored (retry)
                                                          --all retries fail--> errored (wait for next)
                 active --stop--> [not registered]
                 errored --next cron fires--> running
```

---

### 3. Run Log (per-execution record)

One JSON file per execution. Stored at `~/.agentx/scheduler/logs/<agent-name>/<timestamp>.json`.

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | string (ISO 8601) | When the run started |
| `agentName` | string | Agent that was executed |
| `scheduleName` | string | Which schedule entry triggered this run |
| `cron` | string | Cron expression that triggered |
| `prompt` | string | Prompt that was sent |
| `output` | string | Captured stdout from agent run |
| `stderr` | string | Captured stderr (if any) |
| `status` | "success" \| "failure" | Final outcome |
| `duration` | number | Execution time in milliseconds |
| `error` | string \| null | Error message if failed |
| `retryAttempt` | number | 0 = first attempt, 1 = first retry, 2 = second retry |
| `skipped` | boolean | True if this was a skip due to overlap |

**Lifecycle**:
- Created when a scheduled run begins
- Updated when the run completes (status, output, duration)
- Rotated: oldest files deleted when count exceeds 50 per agent

---

### 4. PID File

Simple text file at `~/.agentx/scheduler/scheduler.pid`.

| Content | Type | Description |
|---------|------|-------------|
| PID | number (text) | Process ID of the running daemon |

**Lifecycle**:
- Written when daemon starts
- Deleted when daemon exits (graceful shutdown)
- Stale detection: `process.kill(pid, 0)` returns false → daemon is dead, clean up

---

## File System Layout

```
~/.agentx/
  scheduler/
    scheduler.pid              # Daemon PID file
    state.json                 # Active schedules + runtime state
    logs/
      daily-standup-agent/
        2026-02-07T09-00-00Z.json
        2026-02-07T09-00-00Z.json
        ...
      slack-agent/
        2026-02-07T17-00-00Z.json
        ...
```
