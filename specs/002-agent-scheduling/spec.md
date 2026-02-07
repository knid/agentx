# Feature Specification: Agent Scheduling

**Feature Branch**: `002-agent-scheduling`
**Created**: 2026-02-07
**Status**: Draft
**Input**: User description: "Add a scheduling system to agentx that allows agents to declare scheduled tasks in agent.yaml and run them automatically. Users should be able to define cron-based schedules with prompts, then use an `agentx schedule` command to manage scheduled agents as background daemons. The system should support: declaring schedules in agent.yaml with cron expressions and prompts, an `agentx schedule start/stop/list/logs` CLI interface, a lightweight daemon that runs scheduled agents at the right times, log capture for each run, and graceful error handling (retries, notifications on failure). Should work cross-platform. Keep it simple — prefer a built-in Node.js scheduler over OS-level service managers for v1."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Declare a Schedule in agent.yaml (Priority: P1)

As an agent author, I want to declare one or more scheduled tasks directly in my agent's `agent.yaml` manifest so that users who install my agent can enable automatic execution without any additional setup beyond providing secrets.

A schedule entry includes a cron expression (defining when to run) and a prompt (defining what to ask the agent). For example, a daily standup agent would declare a schedule that runs every weekday at 9am with the prompt "Post the daily standup to the configured channel."

**Why this priority**: Without the ability to declare schedules in the manifest, no other scheduling feature is possible. This is the foundational data model.

**Independent Test**: Can be fully tested by writing an agent.yaml with a `schedule` block and validating it passes schema validation. Delivers value by establishing the contract for all scheduling features.

**Acceptance Scenarios**:

1. **Given** an agent.yaml with a valid `schedule` block containing a cron expression and prompt, **When** the manifest is validated, **Then** validation passes without errors.
2. **Given** an agent.yaml with an invalid cron expression in the schedule block, **When** the manifest is validated, **Then** validation fails with a clear error message indicating the invalid cron syntax.
3. **Given** an agent.yaml with a schedule entry missing the required `prompt` field, **When** the manifest is validated, **Then** validation fails indicating the missing field.
4. **Given** an agent.yaml with multiple schedule entries, **When** the manifest is validated, **Then** all entries are validated independently and the manifest passes if all are valid.

---

### User Story 2 - Start and Stop Scheduled Agents (Priority: P1)

As a user, I want to start an installed agent's schedule so it runs automatically in the background, and stop it when I no longer need automatic runs. I use `agentx schedule start <agent-name>` to begin and `agentx schedule stop <agent-name>` to end.

When I start a schedule, the system launches a background process that watches the clock and runs the agent at each scheduled time. The agent runs exactly as if I had typed `agentx run <agent-name> "<prompt>"` manually. When I stop a schedule, the background process terminates cleanly and no further runs occur.

**Why this priority**: This is the core user-facing interaction — without start/stop, schedules are just metadata with no effect.

**Independent Test**: Can be fully tested by starting a schedule for an agent, observing that it executes at the next scheduled time, then stopping it and confirming no further executions occur.

**Acceptance Scenarios**:

1. **Given** an installed agent with a declared schedule and configured secrets, **When** the user runs `agentx schedule start <agent-name>`, **Then** the system starts a background process and confirms with a message showing the agent name, schedule timing, and next run time.
2. **Given** a running scheduled agent, **When** the scheduled time arrives, **Then** the agent executes with the declared prompt and the output is captured to a log file.
3. **Given** a running scheduled agent, **When** the user runs `agentx schedule stop <agent-name>`, **Then** the background process terminates, a confirmation message is shown, and no further scheduled runs occur.
4. **Given** an agent without a `schedule` block in its manifest, **When** the user runs `agentx schedule start <agent-name>`, **Then** the system displays an error explaining that this agent has no declared schedules.
5. **Given** an agent whose required secrets are not configured, **When** the user runs `agentx schedule start <agent-name>`, **Then** the system displays an error prompting the user to configure secrets first.

---

### User Story 3 - List Active Schedules (Priority: P2)

As a user, I want to see all currently active scheduled agents and their status so I can understand what's running, when each agent last ran, and when it will run next.

**Why this priority**: Visibility into running schedules is essential for managing and debugging, but the system is functional without it (users can track start/stop themselves).

**Independent Test**: Can be fully tested by starting one or more scheduled agents, running the list command, and verifying the output shows correct agent names, statuses, schedules, and timing information.

**Acceptance Scenarios**:

1. **Given** two agents with active schedules, **When** the user runs `agentx schedule list`, **Then** a table is displayed showing each agent's name, cron expression (in human-readable form), last run time, next run time, and status (running/stopped/errored).
2. **Given** no active schedules, **When** the user runs `agentx schedule list`, **Then** a message is displayed indicating no schedules are active, with a hint on how to start one.
3. **Given** a scheduled agent that failed on its last run, **When** the user runs `agentx schedule list`, **Then** the status column shows "errored" and the last run time is displayed.

---

### User Story 4 - View Schedule Logs (Priority: P2)

As a user, I want to view the execution logs of a scheduled agent so I can see what happened during past runs, diagnose failures, and verify the agent is producing expected output.

**Why this priority**: Logs are critical for debugging scheduled agents that run unattended, but the system can function without a dedicated log viewer (users could check log files manually).

**Independent Test**: Can be fully tested by running a scheduled agent at least once, then using the logs command to view the captured output.

**Acceptance Scenarios**:

1. **Given** a scheduled agent that has run 3 times, **When** the user runs `agentx schedule logs <agent-name>`, **Then** the most recent run's output is displayed, including timestamp, prompt used, agent output, and success/failure status.
2. **Given** a scheduled agent with multiple past runs, **When** the user runs `agentx schedule logs <agent-name> --all`, **Then** a summary of all runs is shown with timestamps, statuses, and durations.
3. **Given** a scheduled agent with no prior runs, **When** the user runs `agentx schedule logs <agent-name>`, **Then** a message indicates no runs have occurred yet.
4. **Given** a scheduled agent that failed on its last run, **When** the user views logs, **Then** the error message and any partial output are displayed clearly.

---

### User Story 5 - Automatic Recovery on Failure (Priority: P3)

As a user, I want the scheduler to handle failures gracefully — retrying failed runs and continuing to operate even if one run fails — so that a single transient error doesn't break my entire schedule.

**Why this priority**: Resilience makes the scheduling system production-ready, but a v1 without retry still delivers core value.

**Independent Test**: Can be fully tested by simulating a transient failure (e.g., network timeout) during a scheduled run and verifying the system retries and continues future scheduled runs.

**Acceptance Scenarios**:

1. **Given** a scheduled agent run that fails due to a transient error, **When** the scheduler detects the failure, **Then** it retries the run up to 2 additional times with increasing delay between attempts.
2. **Given** a scheduled agent run that fails after all retry attempts, **When** all retries are exhausted, **Then** the failure is logged with full error details and the schedule continues for the next scheduled time.
3. **Given** a scheduler background process that crashes unexpectedly, **When** the user runs `agentx schedule start <agent-name>`, **Then** the system detects the stale state, cleans it up, and starts a fresh scheduler process.

---

### User Story 6 - Persist Schedules Across System Restarts (Priority: P3)

As a user, I want my active schedules to survive system restarts so I don't have to manually re-start every scheduled agent after rebooting my computer.

**Why this priority**: Persistence is important for a production-quality scheduler but is not needed for initial usability. Users can manually restart schedules after reboot in v1.

**Independent Test**: Can be fully tested by starting a schedule, simulating a system restart (kill and restart the daemon), and verifying the schedule resumes.

**Acceptance Scenarios**:

1. **Given** an active scheduled agent, **When** the scheduler process is terminated (e.g., system reboot), **Then** the schedule state is persisted to disk so it can be restored.
2. **Given** persisted schedule state from a previous session, **When** the user runs `agentx schedule start <agent-name>` or a global resume command, **Then** the scheduler resumes all previously active schedules.
3. **Given** a schedule that missed runs while the system was off, **When** the scheduler resumes, **Then** it does NOT retroactively run missed schedules — it simply waits for the next scheduled time.

---

### Edge Cases

- What happens when a user starts a schedule for an agent that already has an active schedule? The system should inform the user the schedule is already running and offer to restart it.
- What happens when a scheduled agent run takes longer than the interval between scheduled runs? The system should skip the next run (do not queue overlapping executions) and log that a run was skipped due to overlap.
- What happens when the user uninstalls an agent that has an active schedule? The system should automatically stop the schedule and clean up associated state and logs.
- What happens when an agent's manifest is updated with a new schedule after the schedule was already started? The system should use the schedule that was active at start time; the user must stop and restart to pick up changes.
- What happens when the system clock changes significantly (e.g., timezone change, DST transition)? The scheduler should use UTC internally and convert for display, handling clock adjustments gracefully.
- What happens when disk space runs out for log storage? The system should rotate logs, keeping only the most recent runs (default: last 50 runs per agent).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `agent.yaml` schema MUST support an optional `schedule` block containing an array of schedule entries, each with a `cron` expression and a `prompt` string.
- **FR-002**: The system MUST validate cron expressions during manifest validation, rejecting invalid syntax with a clear error message.
- **FR-003**: The system MUST provide an `agentx schedule start <agent-name>` command that registers the agent with the shared scheduler daemon (starting the daemon if not already running).
- **FR-004**: The system MUST provide an `agentx schedule stop <agent-name>` command that unregisters the agent from the shared scheduler daemon (shutting down the daemon if no schedules remain).
- **FR-005**: The system MUST provide an `agentx schedule list` command that displays all active and recently stopped schedules with their status, timing, and last run information.
- **FR-006**: The system MUST provide an `agentx schedule logs <agent-name>` command that displays execution logs for a scheduled agent's runs.
- **FR-007**: When a scheduled time arrives, the system MUST execute the agent with the declared prompt, equivalent to running `agentx run <agent-name> "<prompt>"`.
- **FR-008**: The system MUST capture the full output (stdout and stderr) of each scheduled agent run to a log file.
- **FR-009**: The system MUST prevent overlapping executions — if a run is still in progress when the next scheduled time arrives, the next run is skipped and logged.
- **FR-010**: The system MUST verify that all required secrets are configured before starting a schedule, displaying actionable error messages if secrets are missing.
- **FR-011**: The system MUST support multiple schedule entries per agent (e.g., one for daily reports, another for weekly summaries).
- **FR-012**: The system MUST store schedule state (active schedules, process identifiers, last run times) in the agentx configuration directory.
- **FR-013**: The system MUST automatically stop an agent's schedule when the agent is uninstalled.
- **FR-014**: On failed runs, the system MUST retry up to 2 times with increasing delay before marking the run as failed.
- **FR-015**: The system MUST rotate logs, retaining the last 50 runs per agent by default to prevent unbounded disk usage.
- **FR-016**: The scheduler MUST use UTC internally for cron evaluation and display local time to the user.
- **FR-017**: The `agentx schedule logs` command MUST support a `--all` flag to show a summary of all past runs (vs. the default of showing the most recent run's full output).

### Key Entities

- **Schedule Entry**: A declared schedule in an agent's manifest — contains a cron expression, a prompt to send, and an optional human-readable name/label.
- **Schedule State**: Runtime tracking for an active schedule — includes agent name, process identifier, current status (running/stopped/errored), last run time, next run time, run history references.
- **Run Log**: The captured output of a single scheduled execution — includes timestamp, prompt used, full output, duration, and success/failure status.

## Clarifications

### Session 2026-02-07

- Q: Should the system run one shared daemon or one process per agent? → A: Single shared daemon manages all agent schedules in one process.
- Q: Should there be an explicit idle resource footprint constraint for the daemon? → A: Idle daemon MUST consume less than 50MB RSS memory.

## Assumptions

- The scheduler runs as a single shared detached Node.js background process on the user's machine (not a cloud service). All agent schedules are managed within this one daemon — it starts when the first schedule is activated and shuts down when the last schedule is stopped.
- For v1, schedule persistence across reboots requires the user to manually restart (e.g., `agentx schedule start <agent-name>` again). Full auto-resume via OS-level service managers (launchd, systemd) is deferred to a future version.
- Cron expressions follow the standard 5-field format (minute, hour, day-of-month, month, day-of-week). Extended 6-field (seconds) and 7-field (years) formats are not supported in v1.
- Log files are stored locally in the agentx data directory. There is no remote log shipping or cloud storage in v1.
- The scheduler does not support parameterized prompts (e.g., injecting the current date). The prompt is sent exactly as declared. Users can instruct the agent in the prompt to determine the current date itself.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can declare a schedule in agent.yaml and start it running with a single command in under 30 seconds.
- **SC-002**: Scheduled agents execute within 60 seconds of their declared cron time.
- **SC-003**: Users can view the status of all active schedules in under 5 seconds via the list command.
- **SC-004**: Users can retrieve and read logs from the last scheduled run in under 5 seconds via the logs command.
- **SC-005**: A scheduled agent that encounters a transient failure is retried and succeeds without user intervention (when the underlying issue resolves).
- **SC-006**: The scheduler daemon consumes less than 50MB RSS memory when idle and operates continuously for 7+ days without memory leaks, crashes, or missed runs (excluding system downtime).
- **SC-007**: 100% of schedule-related commands provide clear, actionable feedback — no silent failures or cryptic error messages.
