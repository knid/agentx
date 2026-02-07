# Implementation Plan: Agent Scheduling

**Branch**: `002-agent-scheduling` | **Date**: 2026-02-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-agent-scheduling/spec.md`

## Summary

Add a scheduling system to agentx that allows agents to declare cron-based scheduled tasks in `agent.yaml` and run them automatically via a shared background daemon. Users manage schedules through `agentx schedule start/stop/list/logs`. The daemon is a single Node.js process using `croner` for cron evaluation, communicating with the CLI via filesystem state and Unix signals.

## Technical Context

**Language/Version**: TypeScript (strict mode), ESM, Node.js 18+
**Primary Dependencies**: Commander.js, croner (new), execa, Zod, chalk, @clack/prompts
**Storage**: JSON files in `~/.agentx/scheduler/` (state, logs, PID)
**Testing**: Vitest (globals: true)
**Target Platform**: macOS, Linux (cross-platform Node.js)
**Project Type**: Monorepo — changes scoped to `packages/cli/`
**Performance Goals**: Daemon idle <50MB RSS; agent execution within 60s of cron time
**Constraints**: No OS-level service managers in v1; no external dependencies beyond croner
**Scale/Scope**: Handles 1-20 concurrent agent schedules per user machine

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. CLI-First | PASS | All features are CLI commands (`agentx schedule start/stop/list/logs`) |
| II. Zero-Cost UX | PASS | No paid services; runs locally on user's machine |
| III. npm Model | PASS | Schedules declared in agent.yaml manifest, consistent with package model |
| IV. Claude Code Native | PASS | Daemon spawns `agentx run` which delegates to claude CLI; no embedded LLM calls |
| V. Security by Default | PASS | Secrets loaded from encrypted store at runtime; daemon doesn't persist decrypted secrets; PID file + state file written with restrictive permissions |
| VI. Test-Driven | PASS | Tests written before implementation for all modules |
| VII. Simplicity | PASS | Single daemon process, file-based IPC, croner (zero-dep) library, no sockets or databases |

**Technology Prohibitions Check**:
- No ORM in CLI: PASS (JSON file storage only)
- No paid services: PASS
- No embedded LLM: PASS (delegates to claude CLI via `agentx run`)
- No GUI: PASS
- tsup bundler: PASS (no webpack)
- No Express/Fastify: PASS
- No MongoDB/NoSQL: PASS

**Post-Phase 1 Re-check**: All gates still pass. The daemon is a lightweight Node.js fork, croner has zero dependencies, and all IPC is file-based.

## Project Structure

### Documentation (this feature)

```text
specs/002-agent-scheduling/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: entity definitions
├── quickstart.md        # Phase 1: developer setup guide
├── contracts/
│   └── cli-commands.md  # Phase 1: CLI command specifications
└── tasks.md             # Phase 2: task breakdown (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/cli/src/
├── commands/
│   └── schedule.ts          # NEW: schedule start/stop/list/logs subcommands
├── scheduler/
│   ├── daemon.ts            # NEW: background daemon entry point
│   ├── state.ts             # NEW: read/write state.json
│   ├── log-store.ts         # NEW: run log storage + rotation
│   └── process.ts           # NEW: fork/kill daemon, PID management
├── schemas/
│   └── agent-yaml.ts        # MODIFIED: add schedule schema
├── config/
│   └── paths.ts             # MODIFIED: add SCHEDULER_* paths
├── commands/
│   └── uninstall.ts         # MODIFIED: stop schedule on uninstall
└── index.ts                 # MODIFIED: register schedule command

packages/cli/test/
├── scheduler/
│   ├── state.test.ts        # NEW: state management tests
│   ├── log-store.test.ts    # NEW: log storage + rotation tests
│   └── process.test.ts      # NEW: daemon lifecycle tests
├── commands/
│   └── schedule.test.ts     # NEW: CLI command tests
└── schemas/
    └── agent-yaml.test.ts   # MODIFIED: schedule validation tests
```

**Structure Decision**: Extends existing `packages/cli/src/` layout with a new `scheduler/` module directory. Follows established patterns: commands in `commands/`, schemas in `schemas/`, config in `config/`, tests mirror `src/` structure.

## Complexity Tracking

No constitution violations to justify. The design uses:
- 1 new dependency (`croner`, zero transitive deps)
- 1 new module directory (`scheduler/` with 4 files)
- 1 new command file (`schedule.ts`)
- 3 modified files (schema, paths, uninstall)
- File-based IPC (simplest possible daemon communication)
