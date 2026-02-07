# Tasks: Agent Scheduling

**Input**: Design documents from `/specs/002-agent-scheduling/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/cli-commands.md

**Tests**: TDD approach — tests written before implementation (per constitution Principle VI).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- CLI source: `packages/cli/src/`
- CLI tests: `packages/cli/test/`
- All imports use `.js` extensions (ESM)

---

## Phase 1: Setup

**Purpose**: Install dependency and establish project structure for scheduling feature

- [x] T001 Install `croner` dependency in packages/cli via `npm install croner --workspace=packages/cli`
- [x] T002 [P] Add scheduler path constants (`SCHEDULER_DIR`, `SCHEDULER_PID`, `SCHEDULER_STATE`, `SCHEDULER_LOGS_DIR`) in `packages/cli/src/config/paths.ts`
- [x] T003 [P] Create `packages/cli/src/scheduler/` directory with empty barrel file `packages/cli/src/scheduler/index.ts`

---

## Phase 2: Foundational — Schema Extension

**Purpose**: Extend agent.yaml schema to support `schedule` block — MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Write tests for schedule schema validation (valid cron, invalid cron, missing prompt, multiple entries, max 10 entries, prompt max 2000 chars) in `packages/cli/test/schemas/agent-yaml.test.ts`
- [x] T005 Add `scheduleEntrySchema` (name?, cron, prompt) and `schedule` optional array to `agentYamlSchema` in `packages/cli/src/schemas/agent-yaml.ts` — use `croner` `Cron` class for cron validation in a Zod `.refine()` call
- [x] T006 Verify all existing 115+ tests still pass after schema change by running `npm test --workspace=packages/cli`

**Checkpoint**: Schema extended — `agent.yaml` files with `schedule` blocks now validate correctly

---

## Phase 3: User Story 1 — Declare a Schedule in agent.yaml (Priority: P1) 🎯 MVP

**Goal**: Agent authors can declare cron-based schedules in agent.yaml and have them validated

**Independent Test**: Write an agent.yaml with a `schedule` block, run `agentx validate`, confirm it passes

### Tests for User Story 1

- [x] T007 [P] [US1] Write test for `loadScheduleState()` and `saveScheduleState()` (create, read, update, delete agent entries) in `packages/cli/test/scheduler/state.test.ts`
- [x] T008 [P] [US1] Write test for `writeRunLog()`, `readLatestLog()`, `readAllLogs()`, and `rotateLogs()` (write, read, rotation at 50 files) in `packages/cli/test/scheduler/log-store.test.ts`

### Implementation for User Story 1

- [x] T009 [P] [US1] Implement `SchedulerState`, `AgentScheduleState`, and `ScheduleRunState` TypeScript interfaces in `packages/cli/src/scheduler/state.ts` per data-model.md
- [x] T010 [P] [US1] Implement `RunLog` TypeScript interface and types in `packages/cli/src/scheduler/log-store.ts` per data-model.md
- [x] T011 [US1] Implement `loadScheduleState()`, `saveScheduleState()`, `addAgentToState()`, `removeAgentFromState()` in `packages/cli/src/scheduler/state.ts` — read/write `~/.agentx/scheduler/state.json` with `0o600` permissions
- [x] T012 [US1] Implement `writeRunLog()`, `readLatestLog()`, `readAllLogs()`, `rotateLogs()` in `packages/cli/src/scheduler/log-store.ts` — JSON files in `~/.agentx/scheduler/logs/<agent>/`, rotation keeps last 50
- [x] T013 [US1] Run tests for state and log-store modules, verify all pass

**Checkpoint**: State and log storage modules work independently with full test coverage

---

## Phase 4: User Story 2 — Start and Stop Scheduled Agents (Priority: P1)

**Goal**: Users can start/stop agent schedules via CLI, daemon runs in background and executes agents on cron

**Independent Test**: Run `agentx schedule start <agent>`, verify daemon starts and agent executes at scheduled time, run `agentx schedule stop <agent>`, verify daemon stops

### Tests for User Story 2

- [x] T014 [P] [US2] Write test for `isDaemonRunning()`, `startDaemon()`, `stopDaemon()`, `signalDaemon()`, stale PID cleanup in `packages/cli/test/scheduler/process.test.ts`
- [x] T015 [P] [US2] Write test for `schedule start` command (happy path, no schedule error, missing secrets error, already running) in `packages/cli/test/commands/schedule.test.ts`
- [x] T016 [P] [US2] Write test for `schedule stop` command (happy path, not scheduled error, daemon shutdown when last agent removed) in `packages/cli/test/commands/schedule.test.ts`

### Implementation for User Story 2

- [x] T017 [US2] Implement daemon process management (`isDaemonRunning()`, `getDaemonPid()`, `startDaemon()`, `stopDaemon()`, `signalDaemon()`) in `packages/cli/src/scheduler/process.ts` — PID file at `~/.agentx/scheduler/scheduler.pid`, fork with `detached: true`, stale PID detection via `process.kill(pid, 0)`
- [x] T018 [US2] Implement daemon entry point in `packages/cli/src/scheduler/daemon.ts` — on startup: read state.json, create `Cron` instances for each active schedule; on SIGHUP: re-read state and reconcile jobs; on SIGTERM: stop all jobs and exit cleanly; on cron trigger: spawn `agentx run <agent> "<prompt>"` via execa, capture output, write run log, handle overlap prevention (skip if already running)
- [x] T019 [US2] Implement `schedule start` subcommand in `packages/cli/src/commands/schedule.ts` — load agent manifest, verify schedule block exists, verify secrets configured, write state.json, fork daemon or send SIGHUP, print confirmation with next run times using `Cron.nextRun()`
- [x] T020 [US2] Implement `schedule stop` subcommand in `packages/cli/src/commands/schedule.ts` — read state, remove agent, send SIGHUP or SIGTERM if last agent, print confirmation
- [x] T021 [US2] Register `scheduleCommand` in `packages/cli/src/index.ts` via `program.addCommand(scheduleCommand)`
- [x] T022 [US2] Add tsup entry point for daemon — ensure `packages/cli/src/scheduler/daemon.ts` is either a separate bundle entry or can be resolved by `process.ts` when forking (may need `tsup.config.ts` update to add `src/scheduler/daemon.ts` as a second entry)
- [x] T023 [US2] Run all tests, verify start/stop commands and daemon process management work

**Checkpoint**: Core scheduling loop works — start agent, daemon runs, cron fires, agent executes, stop agent

---

## Phase 5: User Story 3 — List Active Schedules (Priority: P2)

**Goal**: Users can view all active schedules with status, timing, and last run info

**Independent Test**: Start 2 agents with schedules, run `agentx schedule list`, verify table output

### Tests for User Story 3

- [x] T024 [P] [US3] Write test for `schedule list` command (with active schedules, empty state, errored status display) in `packages/cli/test/commands/schedule.test.ts`

### Implementation for User Story 3

- [x] T025 [US3] Implement `schedule list` subcommand in `packages/cli/src/commands/schedule.ts` — read state.json, compute next run times via `Cron`, format table with agent name, cron expression, status, last run (local time), next run (local time); show empty state hint if no schedules
- [x] T026 [US3] Run tests for list command, verify output formatting

**Checkpoint**: Users can view all schedules at a glance

---

## Phase 6: User Story 4 — View Schedule Logs (Priority: P2)

**Goal**: Users can view execution history and debug failed runs

**Independent Test**: Create sample log files, run `agentx schedule logs <agent>`, verify latest run output; run with `--all`, verify summary table

### Tests for User Story 4

- [x] T027 [P] [US4] Write test for `schedule logs` command (latest run display, `--all` summary table, no runs message, failed run error display) in `packages/cli/test/commands/schedule.test.ts`

### Implementation for User Story 4

- [x] T028 [US4] Implement `schedule logs` subcommand in `packages/cli/src/commands/schedule.ts` — default: read latest log file via `readLatestLog()`, display timestamp, schedule name, prompt, full output, status, duration; `--all` flag: read all logs via `readAllLogs()`, render summary table with time, schedule name, status, duration
- [x] T029 [US4] Run tests for logs command, verify output formatting

**Checkpoint**: Users can inspect past runs and debug failures

---

## Phase 7: User Story 5 — Automatic Recovery on Failure (Priority: P3)

**Goal**: Failed runs are retried with backoff; scheduler continues operating after failures

**Independent Test**: Simulate a failing agent run, verify retry occurs up to 2 times with increasing delay, verify schedule continues after exhausting retries

### Tests for User Story 5

- [x] T030 [P] [US5] Write test for retry logic in daemon (retry up to 2 times with backoff, log each attempt with retryAttempt field, continue schedule after exhausted retries) in `packages/cli/test/scheduler/process.test.ts`

### Implementation for User Story 5

- [x] T031 [US5] Add retry logic to daemon's run execution in `packages/cli/src/scheduler/daemon.ts` — on failure: retry up to 2 additional times with delays of 10s and 30s; update run log `retryAttempt` field; update state `errorCount`; after all retries exhausted: mark status as "errored" in state, continue schedule for next cron time
- [x] T032 [US5] Add stale daemon detection to `startDaemon()` in `packages/cli/src/scheduler/process.ts` — if PID file exists but process is dead, clean up PID file and state, start fresh
- [x] T033 [US5] Run tests for retry and stale detection

**Checkpoint**: Scheduling system is resilient to transient failures

---

## Phase 8: User Story 6 — Persist Schedules Across Restarts (Priority: P3)

**Goal**: Schedule state persists to disk; users can resume schedules after system restart

**Independent Test**: Start a schedule, kill daemon, run `agentx schedule start <agent>` again, verify schedule resumes without retroactive runs

### Implementation for User Story 6

- [x] T034 [US6] Ensure `saveScheduleState()` writes atomically (write to temp file, rename) in `packages/cli/src/scheduler/state.ts` so state survives crashes mid-write
- [x] T035 [US6] Add `agentx schedule resume` subcommand in `packages/cli/src/commands/schedule.ts` — reads persisted state.json, re-starts daemon with all previously active agents, skips missed runs (waits for next cron time)
- [x] T036 [US6] Run tests, verify resume behavior

**Checkpoint**: Schedules survive daemon crashes and system restarts

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Integration, edge cases, and cleanup

- [x] T037 Modify `packages/cli/src/commands/uninstall.ts` to check if agent has an active schedule and stop it (remove from state.json, signal daemon) before removing agent files — per FR-013
- [x] T038 [P] Add `schedule` block examples to 2 starter agents: add `schedule` to `packages/agents/slack-agent/agent.yaml` (daily standup) and `packages/agents/github-agent/agent.yaml` (daily PR summary)
- [x] T039 [P] Add help text for all schedule subcommands (start, stop, list, logs, resume) with examples in `packages/cli/src/commands/schedule.ts`
- [x] T040 Run full test suite (`npm test --workspace=packages/cli`), typecheck (`npx tsc --noEmit --project packages/cli/tsconfig.json`), verify all tests pass and no TypeScript errors
- [ ] T041 Manual end-to-end test: install a starter agent with schedule block, configure secrets, run `agentx schedule start`, verify daemon runs, check `agentx schedule list` output, wait for a scheduled run, verify `agentx schedule logs` shows output, run `agentx schedule stop`, verify daemon stops

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — state + log storage modules
- **US2 (Phase 4)**: Depends on Phase 3 — needs state and log-store modules
- **US3 (Phase 5)**: Depends on Phase 4 — needs state.json written by start command
- **US4 (Phase 6)**: Depends on Phase 4 — needs log files written by daemon
- **US5 (Phase 7)**: Depends on Phase 4 — adds retry to existing daemon
- **US6 (Phase 8)**: Depends on Phase 4 — adds resume to existing commands
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundational only — data layer, no CLI commands yet
- **US2 (P1)**: Depends on US1 — needs state.ts and log-store.ts
- **US3 (P2)**: Depends on US2 — reads state.json written by start command
- **US4 (P2)**: Depends on US2 — reads log files written by daemon
- **US5 (P3)**: Depends on US2 — modifies daemon.ts behavior
- **US6 (P3)**: Depends on US2 — modifies state.ts and adds resume command

Note: US3 and US4 can be done in parallel after US2. US5 and US6 can be done in parallel after US2.

### Parallel Opportunities

- T002 and T003 can run in parallel (Setup phase)
- T007 and T008 can run in parallel (US1 tests)
- T009 and T010 can run in parallel (US1 interfaces)
- T014, T015, and T016 can run in parallel (US2 tests)
- Phase 5 (US3) and Phase 6 (US4) can run in parallel after Phase 4
- Phase 7 (US5) and Phase 8 (US6) can run in parallel after Phase 4
- T038 and T039 can run in parallel (Polish phase)

---

## Parallel Example: User Story 2

```
# Launch all tests for US2 together:
T014: "Test daemon process management in test/scheduler/process.test.ts"
T015: "Test schedule start command in test/commands/schedule.test.ts"
T016: "Test schedule stop command in test/commands/schedule.test.ts"

# After tests are written, implement in order:
T017: process.ts (daemon management)
T018: daemon.ts (entry point)
T019: schedule start command
T020: schedule stop command
T021: register in index.ts
T022: tsup entry for daemon
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Schema Extension (T004-T006)
3. Complete Phase 3: US1 — State + Logs (T007-T013)
4. Complete Phase 4: US2 — Start/Stop + Daemon (T014-T023)
5. **STOP and VALIDATE**: `agentx schedule start/stop` works end-to-end
6. This is a shippable MVP — agents can be scheduled and executed

### Incremental Delivery

1. Setup + Schema → Schema validated
2. US1 (state + logs) → Data layer ready
3. US2 (start/stop + daemon) → **MVP: scheduling works!**
4. US3 (list) → Visibility into schedules
5. US4 (logs) → Debug past runs
6. US5 (retry) → Resilience
7. US6 (resume) → Persistence across restarts
8. Polish → Production-ready

---

## Notes

- All imports use `.js` extensions (ESM requirement)
- Build: `npm run build --workspace=packages/cli`
- Test: `npm test --workspace=packages/cli`
- Typecheck: `npx tsc --noEmit --project packages/cli/tsconfig.json`
- The daemon entry point (`daemon.ts`) needs a separate tsup entry or must be resolvable at runtime
- State files use `0o600` permissions for security (consistent with auth.json pattern)
- Commit after each task or logical group
