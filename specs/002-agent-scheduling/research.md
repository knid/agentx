# Research: Agent Scheduling

**Feature**: 002-agent-scheduling
**Date**: 2026-02-07

## R1: Cron Parsing & Scheduling Library

**Decision**: Use `croner` for cron parsing, validation, next-run computation, and scheduling.

**Rationale**:
- Zero dependencies — aligns with constitution (minimal footprint)
- Single package covers all three needs: validation, next-run calculation, and callback scheduling
- Best benchmark score (85.8/100) among alternatives
- Used in production by PM2, Uptime Kuma, ZWave JS
- Supports standard 5-field cron + human-readable patterns (`@daily`, `@weekly`)
- Built-in `nextRun()`, `nextRuns(n)`, `msToNext()` APIs
- Pause/resume/stop methods match our start/stop semantics
- Works in Node.js 18+ (our target)

**Alternatives Considered**:
- `node-cron` — Good but fewer features (no `nextRuns(n)`, lower benchmark score)
- `cron-parser` — Parse-only, no scheduler; would need a second package for execution
- `cron` — Legacy, 6-field default, less maintained

**Key API Surface**:
```typescript
import { Cron } from 'croner';

// Validate
const isValid = Cron.isValid('0 9 * * 1-5');

// Schedule
const job = new Cron('0 9 * * 1-5', () => { /* run agent */ });

// Inspect
job.nextRun();      // Date | null
job.nextRuns(5);    // Date[]
job.msToNext();     // number

// Control
job.pause();
job.resume();
job.stop();
```

## R2: Background Daemon Architecture

**Decision**: Single shared Node.js daemon process, spawned as a detached child process via `child_process.fork()` with `detached: true` and `stdio: 'ignore'`.

**Rationale**:
- `fork()` creates a Node.js subprocess that can run independently after the parent CLI exits
- Detached mode + `unref()` allows the CLI to exit while the daemon continues
- PID file stored at `~/.agentx/scheduler.pid` for process management
- IPC via the filesystem (state JSON file) — simplest possible approach, no sockets needed
- The daemon process loads a dedicated entry point (`src/scheduler/daemon.ts`) that:
  1. Reads schedule state from `~/.agentx/scheduler/state.json`
  2. Creates `Cron` instances for each active schedule
  3. On each trigger, spawns `agentx run <agent> "<prompt>"` via `execa`
  4. Writes run logs to `~/.agentx/scheduler/logs/<agent>/<timestamp>.json`

**Alternatives Considered**:
- OS-level service managers (launchd/systemd) — Too complex for v1, platform-specific
- Socket-based IPC — Overkill; file-based state is sufficient for start/stop/list
- PM2 — External dependency, violates simplicity principle

## R3: Process Management Pattern

**Decision**: PID file + signal-based lifecycle.

**Rationale**:
- `agentx schedule start` checks for existing daemon → if not running, fork a new one; if running, send the new schedule via state file + SIGHUP
- `agentx schedule stop` removes agent from state file + sends SIGHUP to reload; if no schedules remain, sends SIGTERM
- `agentx schedule list` reads state file directly (no daemon interaction needed)
- `agentx schedule logs` reads log files directly (no daemon interaction needed)
- Stale PID detection: check if process exists via `process.kill(pid, 0)` before trusting PID file

**Communication Protocol**:
1. CLI writes desired state to `~/.agentx/scheduler/state.json`
2. CLI sends `SIGHUP` to daemon PID
3. Daemon receives SIGHUP → re-reads state.json → reconciles cron jobs
4. No response needed — CLI reads state.json for confirmation after a brief delay

## R4: Log Storage & Rotation

**Decision**: JSON log files, one per run, in `~/.agentx/scheduler/logs/<agent-name>/`.

**Rationale**:
- Each run produces a file: `<ISO-timestamp>.json` containing `{ timestamp, prompt, output, duration, status, error? }`
- Rotation: after each run, count files in agent's log dir; if > 50, delete oldest
- `agentx schedule logs <agent>` reads the newest file; `--all` reads all and renders summary table
- JSON format makes programmatic access easy while remaining human-readable

**Alternatives Considered**:
- Single append-only log file — Harder to rotate, harder to read individual runs
- SQLite database — Over-engineered for local logs, adds dependency
- Structured logging to stderr — No persistence, can't review past runs

## R5: Schema Extension for agent.yaml

**Decision**: Add optional `schedule` array to the existing Zod schema.

**Rationale**:
- Array (not record) to support multiple schedules with ordering
- Each entry: `{ name?: string, cron: string, prompt: string }`
- `name` is optional — used for display in `schedule list` (defaults to cron expression)
- Cron validation via `Cron.isValid()` in a Zod `.refine()` call
- Backward compatible — fully optional, existing agents unaffected

```yaml
schedule:
  - name: "Daily standup"
    cron: "0 9 * * 1-5"
    prompt: "Post the daily standup to the configured channel"
  - name: "Weekly summary"
    cron: "0 17 * * 5"
    prompt: "Generate and post the weekly activity summary"
```
