# Spec-Kit Tasks Prompt for agentx

Use this prompt with `/speckit.tasks` to generate the dependency-ordered task list.

---

## Prompt

```
Generate a dependency-ordered task list for the agentx MVP based on:
- spec.md: 7 user stories (US1-US7) with priorities P1-P7
- plan.md: monorepo structure (packages/cli, packages/web, packages/agents)
- data-model.md: 6 remote entities + 4 local entities
- contracts/registry-api.md: 15+ API endpoints

Task organization rules:

Phase 1: Setup (13 tasks)
- Create monorepo root with npm workspaces (package.json, tsconfig.base.json)
- Initialize packages/cli with package.json, tsconfig, tsup.config, vitest.config
- Initialize packages/web with Next.js 15
- Initialize packages/agents
- Create CI/CD workflows (.github/workflows/ci.yml, release.yml)
- Create root LICENSE (MIT), README.md, .eslintrc.js, .prettierrc

Phase 2: Foundational (14 tasks) -- BLOCKS ALL USER STORIES
- CLI entry point (packages/cli/src/index.ts with Commander)
- Path constants (packages/cli/src/config/paths.ts -- AGENTX_HOME, AGENTS_DIR, etc.)
- Directory initialization (packages/cli/src/utils/init-dirs.ts)
- Error classes (packages/cli/src/utils/errors.ts)
- UI utilities (colors.ts, spinner.ts, table.ts -- all parallelizable)
- Zod schemas (agent-yaml.ts, config.ts)
- Type definitions (agent.ts, registry.ts, config.ts -- parallelizable)
- Config managers (global-config.ts, agent-config.ts)

Phase 3: US1 - Run Agent (P1, MVP core) -- 13 tasks
- Tests first: prompt-processor, mcp-builder, pipe-handler, runner (all [P])
- Test fixtures: valid-agent, invalid-agent (all [P])
- Implementation: prompt-processor, mcp-builder, pipe-handler, output-formatter, runner
- Command: run.ts, wire into index.ts

Phase 4: US7 - Configure Secrets (moved up, US1 depends on it for agents with secrets) -- 7 tasks
- Tests first: encrypt.test.ts, store.test.ts (all [P])
- Implementation: encrypt.ts, store.ts, configure-flow.ts
- Command: configure.ts, wire into index.ts

Phase 5: US5 - Scaffold/Test (moved up for ecosystem enablement) -- 8 tasks
- Tests first: agent-yaml.test.ts, doctor.test.ts (all [P])
- Implementation: template files, init.ts, validate.ts, test.ts, doctor.ts
- Wire all into index.ts

Phase 6: US4 - Publish (moved up, enables US2/US3) -- 21 tasks
- Registry backend: Drizzle schema, DB connection, migration, R2 client, rate limiter, validation, GitHub OAuth
- Auth API routes: POST /auth/github, GET /auth/callback
- CLI auth: github-oauth.ts, token-store.ts, login.ts, logout.ts, whoami.ts
- Publish: tar.ts, hash.ts, registry client, publish client, PUT API route, publish command

Phase 7: US2 - Install (P2) -- 12 tasks
- Tests first: download.test.ts, semver.test.ts
- Implementation: semver utils, download module, GET agent info route, GET download route
- Commands: install.ts, uninstall.ts, list.ts, update.ts, info.ts, wire all

Phase 8: US3 - Search (P3) -- 7 tasks
- API routes: GET /search, GET /trending, GET /categories
- Implementation: search client
- Commands: search.ts, trending.ts, wire all

Phase 9: US6 - Website (P6) -- 18 tasks
- Shared components: Header, Footer, AgentCard, InstallCommand, AgentSearch, CategoryBadge
- Pages: landing, browse, detail, category, user profile, docs index
- Documentation MDX: getting-started, creating-agents, agent-yaml-reference
- API routes: GET /users/:username

Phase 10: Starter Agents -- 5 tasks (all [P])
- gmail-agent, github-agent, data-analyst, slack-agent, code-reviewer

Phase 11: Telemetry -- 3 tasks
- telemetry reporter, POST /telemetry route, integration into runner

Phase 12: Polish -- 14 tasks
- README, CONTRIBUTING, config command, --help text, --version, --verbose/--debug
- End-to-end test, security audit, performance profiling, quickstart validation
- npm publish config, Vercel deployment verification, publish starter agents

Total: ~135 tasks
Critical path: Setup -> Foundational -> US1 (Run) -> US4 (Publish backend) -> US2 (Install) -> Launch

Key reordering from spec priorities:
- US7 (P7) moved to Phase 4 because US1 needs secrets resolution for agents with MCP
- US5 (P5) moved to Phase 5 because agent creation enables the publish flow
- US4 (P4) moved to Phase 6 because US2 (Install) and US3 (Search) depend on registry data

Parallel opportunities:
- Phase 1 setup tasks are mostly parallel
- Phase 2 UI and type definition tasks are parallel
- US1 tests are all parallel
- US1, US7, US5 can start in parallel after Phase 2
- All 5 starter agents can be created in parallel
- Website components can be created in parallel
```

---

## Expected Output

A tasks.md at `specs/1-mvp-cli-agent-marketplace/tasks.md` with:
- 135 tasks in strict checklist format: `- [ ] TXXX [P?] [USn?] Description with file path`
- 12 phases with clear dependencies
- Checkpoint after each phase
- Dependency graph showing execution order
- Parallel execution examples
- Implementation strategy (MVP first, incremental delivery, parallel team)
