# Developer Quickstart: Agent Scheduling

**Feature**: 002-agent-scheduling
**Date**: 2026-02-07

## Prerequisites

- Node.js 18+
- agentx CLI built (`npm run build --workspace=packages/cli`)
- Tests passing (`npm test --workspace=packages/cli`)

## New Dependency

```bash
npm install croner --workspace=packages/cli
```

## Key Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/scheduler/daemon.ts` | Background daemon entry point — loads state, creates Cron jobs, executes agents |
| `src/scheduler/state.ts` | Read/write `~/.agentx/scheduler/state.json` — schedule state management |
| `src/scheduler/log-store.ts` | Read/write run logs, rotation logic |
| `src/scheduler/process.ts` | Fork/kill daemon, PID file management, SIGHUP signaling |
| `src/commands/schedule.ts` | Commander subcommand group: start, stop, list, logs |
| `test/scheduler/state.test.ts` | State management unit tests |
| `test/scheduler/log-store.test.ts` | Log storage and rotation tests |
| `test/scheduler/process.test.ts` | Daemon lifecycle tests |
| `test/commands/schedule.test.ts` | CLI command integration tests |

### Modified Files

| File | Change |
|------|--------|
| `src/schemas/agent-yaml.ts` | Add `schedule` array schema with cron validation |
| `src/config/paths.ts` | Add `SCHEDULER_DIR`, `SCHEDULER_PID`, `SCHEDULER_STATE`, `SCHEDULER_LOGS_DIR` |
| `src/commands/uninstall.ts` | Stop agent's schedule before uninstalling |
| `src/index.ts` | Register `schedule` command group |
| `test/schemas/agent-yaml.test.ts` | Add tests for schedule block validation |

## Build & Test

```bash
# Build
npm run build --workspace=packages/cli

# Run all tests
npm test --workspace=packages/cli

# Typecheck
npx tsc --noEmit --project packages/cli/tsconfig.json

# Manual test
agentx schedule start slack-agent
agentx schedule list
agentx schedule logs slack-agent
agentx schedule stop slack-agent
```

## Architecture Overview

```
CLI (agentx schedule start)
  │
  ├── Writes state.json
  ├── Forks daemon (if not running)
  └── Sends SIGHUP (if running)
        │
        ▼
Daemon (scheduler/daemon.ts)
  │
  ├── Reads state.json
  ├── Creates Cron instances (croner)
  ├── On trigger: spawns `agentx run <agent> "<prompt>"`
  ├── Writes log files
  └── Handles SIGHUP (reload), SIGTERM (shutdown)
```

## Implementation Order

1. Schema extension (agent-yaml.ts + tests)
2. Config paths (paths.ts)
3. State management (state.ts + tests)
4. Log storage (log-store.ts + tests)
5. Daemon process management (process.ts + tests)
6. Daemon entry point (daemon.ts)
7. CLI commands (schedule.ts + tests)
8. Uninstall hook (uninstall.ts modification)
9. Starter agent schedule examples
