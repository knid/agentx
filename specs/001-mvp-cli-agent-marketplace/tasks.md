# Tasks: MVP CLI Agent Marketplace

**Input**: Design documents from `specs/1-mvp-cli-agent-marketplace/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/registry-api.md, research.md

**Tests**: Tests are included as this project requires TDD per the constitution (Principle VI).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, monorepo setup, and shared configuration

- [x] T001 Create monorepo root with npm workspaces config in package.json (workspaces: ["packages/*"])
- [x] T002 Create shared TypeScript config in tsconfig.base.json with strict mode, ES2022 target, Node module resolution
- [x] T003 [P] Create packages/cli/ directory with package.json (name: "agentx", bin: {"agentx": "./dist/index.js"}, dependencies: commander, execa, clack, zod, yaml, ofetch, devDependencies: tsup, vitest, typescript)
- [x] T004 [P] Create packages/web/ directory with Next.js 15 app router setup (npx create-next-app@latest with TypeScript, Tailwind, App Router)
- [x] T005 [P] Create packages/agents/ directory with package.json for official starter agents
- [x] T006 Create packages/cli/tsconfig.json extending tsconfig.base.json
- [x] T007 Create packages/cli/tsup.config.ts with entry: src/index.ts, format: esm, target: node18, dts: true, shims: true
- [x] T008 Create packages/cli/vitest.config.ts with test include patterns and coverage settings
- [x] T009 [P] Create .github/workflows/ci.yml with lint + test + build on PR
- [x] T010 [P] Create .github/workflows/release.yml with npm publish on v* tag push
- [x] T011 [P] Create root .eslintrc.js and .prettierrc for consistent formatting
- [x] T012 Create root LICENSE file (MIT)
- [x] T013 Create root README.md with project overview, install instructions, and badges

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T014 Create CLI entry point at packages/cli/src/index.ts with Commander program setup (name: "agentx", description, version from package.json)
- [x] T015 Create path constants at packages/cli/src/config/paths.ts defining AGENTX_HOME (~/.agentx), AGENTS_DIR, SECRETS_DIR, CONFIG_PATH, AUTH_PATH, CACHE_DIR, LOGS_DIR
- [x] T016 Create directory initialization utility at packages/cli/src/utils/init-dirs.ts to create ~/.agentx/ structure on first use
- [x] T017 Create custom error classes at packages/cli/src/utils/errors.ts (AgentNotFoundError, ConfigError, AuthError, RegistryError, ValidationError)
- [x] T018 [P] Create color and formatting utilities at packages/cli/src/ui/colors.ts with --no-color support via chalk
- [x] T019 [P] Create spinner utility at packages/cli/src/ui/spinner.ts wrapping clack spinner
- [x] T020 [P] Create table formatting utility at packages/cli/src/ui/table.ts for agent lists and search results
- [x] T021 Create Zod schema for agent.yaml at packages/cli/src/schemas/agent-yaml.ts with all required and optional fields per data-model.md validation rules
- [x] T022 Create Zod schema for global config at packages/cli/src/schemas/config.ts
- [x] T023 Create TypeScript type definitions at packages/cli/src/types/agent.ts (AgentManifest, AgentConfig, MCPServerConfig, SecretDeclaration, Permission)
- [x] T024 [P] Create TypeScript type definitions at packages/cli/src/types/registry.ts (SearchResult, AgentInfo, PublishResponse, AuthResponse)
- [x] T025 [P] Create TypeScript type definitions at packages/cli/src/types/config.ts (GlobalConfig, AuthToken, SecretStore)
- [x] T026 Create global config manager at packages/cli/src/config/global-config.ts (load, save, get, set for ~/.agentx/config.yaml)
- [x] T027 Create agent config manager at packages/cli/src/config/agent-config.ts (loadAgentYaml, loadSystemPrompt, getAgentDir)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Run a Local Agent (Priority: P1) MVP

**Goal**: Users can run a locally available agent from the terminal with `agentx run <agent> "prompt"`

**Independent Test**: Create a minimal test agent (agent.yaml + system-prompt.md), run `agentx run test-agent "hello"`, verify claude CLI is spawned with correct flags.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T028 [P] [US1] Unit test for prompt processor at packages/cli/test/runtime/prompt-processor.test.ts - test {{config.key}} replacement, missing variable handling, multiple variables
- [x] T029 [P] [US1] Unit test for MCP config builder at packages/cli/test/runtime/mcp-builder.test.ts - test secret resolution (${secrets.KEY}), empty servers, nested env vars
- [x] T030 [P] [US1] Unit test for pipe handler at packages/cli/test/runtime/pipe-handler.test.ts - test stdin detection, content prepending to prompt
- [x] T031 [P] [US1] Unit test for runner at packages/cli/test/runtime/runner.test.ts - test claude CLI spawning with correct args, error handling, cleanup
- [x] T032 [P] [US1] Create test fixtures at packages/cli/test/fixtures/valid-agent/ with agent.yaml and system-prompt.md
- [x] T033 [P] [US1] Create test fixtures at packages/cli/test/fixtures/invalid-agent/ with malformed agent.yaml

### Implementation for User Story 1

- [x] T034 [US1] Implement prompt processor at packages/cli/src/runtime/prompt-processor.ts - loadAndProcessSystemPrompt(agentDir, agentYaml, configOverrides) replacing {{config.key}} with values or defaults
- [x] T035 [US1] Implement MCP config builder at packages/cli/src/runtime/mcp-builder.ts - resolveMCPConfig(servers, secrets) resolving ${secrets.KEY} references, writeTempMCPConfig(config) returning temp file path
- [x] T036 [US1] Implement pipe handler at packages/cli/src/runtime/pipe-handler.ts - detectPipedInput() and buildPromptWithPipe(prompt, pipedContent)
- [x] T037 [US1] Implement output formatter at packages/cli/src/runtime/output-formatter.ts - formatOutput(data, format: text|json)
- [x] T038 [US1] Implement core runner at packages/cli/src/runtime/runner.ts - runAgent(agentName, options: RunOptions) orchestrating: load agent -> decrypt secrets -> build MCP config -> build prompt -> spawn claude -> stream output -> cleanup
- [x] T039 [US1] Implement the `run` command at packages/cli/src/commands/run.ts - register with Commander, parse flags (-i, --file, --json, --quiet, --debug, --output-format), call runner
- [x] T040 [US1] Wire run command into packages/cli/src/index.ts

**Checkpoint**: User Story 1 fully functional - `agentx run <agent> "prompt"` works with local agents

---

## Phase 4: User Story 7 - Configure Agent Secrets (Priority: P7, moved up as P1 dependency)

**Goal**: Users can configure and store encrypted secrets for agents that require API tokens

**Independent Test**: Store a test secret, verify encrypted file exists, verify decryption returns original value.

> Note: This story is moved up because US1 (run) depends on secrets for MCP config resolution.

### Tests for User Story 7

- [x] T041 [P] [US7] Unit test for encryption at packages/cli/test/secrets/encrypt.test.ts - test encrypt/decrypt roundtrip, key derivation, tamper detection
- [x] T042 [P] [US7] Unit test for secret store at packages/cli/test/secrets/store.test.ts - test save/load/delete, missing file handling

### Implementation for User Story 7

- [ ] T043 [US7] Implement encryption module at packages/cli/src/secrets/encrypt.ts - deriveKey(), encrypt(secrets), decrypt(encrypted)
- [ ] T044 [US7] Implement secret store at packages/cli/src/secrets/store.ts - saveSecrets(agentName, secrets), loadSecrets(agentName), deleteSecrets(agentName), hasSecrets(agentName)
- [ ] T045 [US7] Implement configure flow at packages/cli/src/secrets/configure-flow.ts - interactive prompts (clack) for each declared secret in agent.yaml
- [ ] T046 [US7] Implement the `configure` command at packages/cli/src/commands/configure.ts - register with Commander, load agent.yaml secrets declarations, run configure flow
- [ ] T047 [US7] Wire configure command into packages/cli/src/index.ts

**Checkpoint**: Users can configure agent secrets, secrets are encrypted at rest, run command can resolve ${secrets.*}

---

## Phase 5: User Story 5 - Scaffold and Test Agents (Priority: P5, moved up for ecosystem enablement)

**Goal**: Agent creators can scaffold new agents and validate them locally

**Independent Test**: Run `agentx init`, verify output directory structure, run `agentx validate` on the scaffold.

### Tests for User Story 5

- [x] T048 [P] [US5] Unit test for agent.yaml validation at packages/cli/test/schemas/agent-yaml.test.ts - test valid schema, missing fields, invalid semver, invalid category
- [x] T049 [P] [US5] Unit test for doctor command at packages/cli/test/commands/doctor.test.ts - test claude detection, node version check

### Implementation for User Story 5

- [ ] T050 [P] [US5] Create init template files at packages/cli/src/templates/basic/agent.yaml (with placeholders), system-prompt.md (with example content), README.md, LICENSE
- [ ] T051 [US5] Implement the `init` command at packages/cli/src/commands/init.ts - clack prompts for name, description, category, MCP servers, license; copy and populate templates
- [ ] T052 [US5] Implement the `validate` command at packages/cli/src/commands/validate.ts - parse agent.yaml with Zod schema, check system-prompt.md exists, report errors
- [ ] T053 [US5] Implement the `test` command at packages/cli/src/commands/test.ts - run validate + attempt MCP server startability check
- [ ] T054 [US5] Implement the `doctor` command at packages/cli/src/commands/doctor.ts - check claude CLI (which claude + version), Node.js version, agentx version, auth status
- [ ] T055 [US5] Wire init, validate, test, doctor commands into packages/cli/src/index.ts

**Checkpoint**: Creators can scaffold agents and validate them locally

---

## Phase 6: User Story 4 - Publish to Registry (Priority: P4, moved up as US2 prerequisite)

**Goal**: Authenticated creators can publish agent packages to the registry

**Independent Test**: Publish a test agent, verify it appears in the database and tarball is in R2.

### Registry Backend Setup (prerequisite for publish, install, and search)

- [ ] T056 Create Drizzle schema at packages/web/src/lib/db/schema.ts with users, agents, agent_versions, stars, downloads, telemetry tables per data-model.md
- [ ] T057 Create DB connection at packages/web/src/lib/db/index.ts using @neondatabase/serverless with Drizzle adapter
- [ ] T058 Generate initial Drizzle migration at packages/web/src/lib/db/migrations/ using `drizzle-kit generate`
- [ ] T059 [P] Create R2 storage client at packages/web/src/lib/storage/r2.ts using @aws-sdk/client-s3 (S3Client with R2 endpoint)
- [ ] T060 [P] Create rate limiter at packages/web/src/lib/utils/rate-limit.ts using @upstash/ratelimit
- [ ] T061 [P] Create server-side validation helpers at packages/web/src/lib/utils/validation.ts for agent.yaml server validation
- [ ] T062 Create GitHub OAuth helper at packages/web/src/lib/auth/github.ts - exchangeCodeForToken(), getUserProfile(), generateAgentxToken()

### Auth API Routes

- [ ] T063 [US4] Implement POST /api/v1/auth/github route at packages/web/src/app/api/v1/auth/github/route.ts - generate auth URL with redirect
- [ ] T064 [US4] Implement GET /api/v1/auth/callback route at packages/web/src/app/api/v1/auth/callback/route.ts - exchange code, create/update user, return token

### CLI Auth Commands

- [ ] T065 [US4] Implement GitHub OAuth flow at packages/cli/src/auth/github-oauth.ts - start local server, open browser, receive callback, exchange for token
- [ ] T066 [US4] Implement token store at packages/cli/src/auth/token-store.ts - saveToken(), loadToken(), clearToken(), isAuthenticated()
- [ ] T067 [US4] Implement the `login` command at packages/cli/src/commands/login.ts - trigger OAuth flow, save token
- [ ] T068 [P] [US4] Implement the `logout` command at packages/cli/src/commands/logout.ts - clear token
- [ ] T069 [P] [US4] Implement the `whoami` command at packages/cli/src/commands/whoami.ts - display username and auth status

### Publish Pipeline

- [ ] T070 [US4] Implement tarball creation at packages/cli/src/utils/tar.ts - createTarball(agentDir) returns Buffer and SHA-256 hash
- [ ] T071 [US4] Implement SHA-256 hashing at packages/cli/src/utils/hash.ts - hashBuffer(buffer), hashFile(path)
- [ ] T072 [US4] Implement registry client at packages/cli/src/registry/client.ts - base HTTP client with auth headers, error handling
- [ ] T073 [US4] Implement publish client at packages/cli/src/registry/publish.ts - publishAgent(agentDir) validates, creates tarball, uploads via registry client
- [ ] T074 [US4] Implement PUT /api/v1/agents/:scope/:name route at packages/web/src/app/api/v1/agents/route.ts - authenticate, validate, upload to R2, insert/update DB
- [ ] T075 [US4] Implement the `publish` command at packages/cli/src/commands/publish.ts - validate, authenticate check, call publish client, display result URL
- [ ] T076 [US4] Wire login, logout, whoami, publish commands into packages/cli/src/index.ts

**Checkpoint**: End-to-end publish flow works - agent creator can authenticate and publish an agent

---

## Phase 7: User Story 2 - Install Agents from Registry (Priority: P2)

**Goal**: Users can install agents from the registry, list them, update, and uninstall

**Independent Test**: Publish a test agent, then `agentx install @test/agent`, verify files in ~/.agentx/agents/.

### Tests for User Story 2

- [ ] T077 [P] [US2] Unit test for download module at packages/cli/test/registry/download.test.ts - test tarball download, SHA-256 verification, extraction
- [ ] T078 [P] [US2] Unit test for semver utilities at packages/cli/test/utils/semver.test.ts - test version comparison, range matching

### Implementation for User Story 2

- [ ] T079 [US2] Implement semver utilities at packages/cli/src/utils/semver.ts - compareVersions(), satisfiesRange(), isNewerThan()
- [ ] T080 [US2] Implement download module at packages/cli/src/registry/download.ts - downloadAgent(scope, name, version) fetching metadata, downloading tarball, verifying SHA-256, extracting to agents dir
- [ ] T081 [US2] Implement GET /api/v1/agents/:scope/:name route at packages/web/src/app/api/v1/agents/[scope]/[name]/route.ts - return agent metadata
- [ ] T082 [US2] Implement GET /api/v1/agents/:scope/:name/download/:version route at packages/web/src/app/api/v1/agents/[scope]/[name]/download/[version]/route.ts - return tarball URL and SHA-256, increment download count
- [ ] T083 [US2] Implement the `install` command at packages/cli/src/commands/install.ts - parse scope/name/version, call download module, warn if secrets needed
- [ ] T084 [US2] Implement the `uninstall` command at packages/cli/src/commands/uninstall.ts - remove agent dir and secrets
- [ ] T085 [US2] Implement the `list` command at packages/cli/src/commands/list.ts - scan ~/.agentx/agents/, read each agent.yaml, display table
- [ ] T086 [US2] Implement the `update` command at packages/cli/src/commands/update.ts - check registry for newer versions, re-download if available, support --all flag
- [ ] T087 [US2] Implement the `info` command at packages/cli/src/commands/info.ts - fetch and display agent details from registry
- [ ] T088 [US2] Wire install, uninstall, list, update, info commands into packages/cli/src/index.ts

**Checkpoint**: Full agent lifecycle works - install -> configure -> run -> update -> uninstall

---

## Phase 8: User Story 3 - Search and Discover Agents (Priority: P3)

**Goal**: Users can search for agents via CLI and see trending agents

**Independent Test**: Seed 5+ agents in registry, run `agentx search "email"`, verify matching results.

### Implementation for User Story 3

- [ ] T089 [US3] Implement GET /api/v1/search route at packages/web/src/app/api/v1/search/route.ts - PostgreSQL full-text search with tsvector/tsquery
- [ ] T090 [US3] Implement GET /api/v1/trending route at packages/web/src/app/api/v1/trending/route.ts - query agents sorted by download count within period
- [ ] T091 [US3] Implement GET /api/v1/categories route at packages/web/src/app/api/v1/categories/route.ts - distinct categories with counts
- [ ] T092 [US3] Implement search client at packages/cli/src/registry/search.ts - searchAgents(query, options), getTrending(period)
- [ ] T093 [US3] Implement the `search` command at packages/cli/src/commands/search.ts - display results as formatted table with name, description, stars, downloads
- [ ] T094 [US3] Implement the `trending` command at packages/cli/src/commands/trending.ts - display trending agents
- [ ] T095 [US3] Wire search and trending commands into packages/cli/src/index.ts

**Checkpoint**: Users can discover agents via CLI search and trending

---

## Phase 9: User Story 6 - Browse Agents on agentx.dev (Priority: P6)

**Goal**: Users can browse and discover agents via the agentx.dev website

**Independent Test**: Visit agentx.dev, verify landing page loads, search returns results, agent detail pages render.

### Implementation for User Story 6

- [ ] T096 [P] [US6] Create root layout at packages/web/src/app/layout.tsx with Tailwind, metadata, Header/Footer components
- [ ] T097 [P] [US6] Create Header component at packages/web/src/components/Header.tsx with logo, search bar, navigation
- [ ] T098 [P] [US6] Create Footer component at packages/web/src/components/Footer.tsx with links, GitHub, MIT badge
- [ ] T099 [US6] Create AgentCard component at packages/web/src/components/AgentCard.tsx - display name, description, stats, install command
- [ ] T100 [US6] Create InstallCommand component at packages/web/src/components/InstallCommand.tsx - copy-to-clipboard install command
- [ ] T101 [US6] Create AgentSearch component at packages/web/src/components/AgentSearch.tsx - search input with results
- [ ] T102 [US6] Create CategoryBadge component at packages/web/src/components/CategoryBadge.tsx
- [ ] T103 [US6] Create landing page at packages/web/src/app/page.tsx - hero section, search bar, featured agents, categories
- [ ] T104 [US6] Create agent browse page at packages/web/src/app/agents/page.tsx - paginated list with search and category filters
- [ ] T105 [US6] Create agent detail page at packages/web/src/app/agents/[scope]/[name]/page.tsx - README, install command, stats, examples, permissions, MCP servers
- [ ] T106 [US6] Create category page at packages/web/src/app/categories/[category]/page.tsx - filtered agent list
- [ ] T107 [US6] Create user profile page at packages/web/src/app/users/[username]/page.tsx - avatar, bio, published agents
- [ ] T108 [US6] Create docs index at packages/web/src/app/docs/page.tsx
- [ ] T109 [P] [US6] Write getting-started doc at packages/web/content/docs/getting-started.mdx
- [ ] T110 [P] [US6] Write creating-agents doc at packages/web/content/docs/creating-agents.mdx
- [ ] T111 [P] [US6] Write agent.yaml reference doc at packages/web/content/docs/agent-yaml-reference.mdx
- [ ] T112 [US6] Implement GET /api/v1/users/:username route at packages/web/src/app/api/v1/users/[username]/route.ts
- [ ] T113 [US6] Implement GET /api/v1/users/:username/agents route (extend users API)

**Checkpoint**: agentx.dev is live with landing page, agent browse/detail, and documentation

---

## Phase 10: Starter Agents

**Purpose**: Create the 5 official starter agents for launch

- [ ] T114 [P] Create @agentx/gmail-agent at packages/agents/gmail-agent/ - agent.yaml (Gmail MCP server), system-prompt.md (email assistant), README.md
- [ ] T115 [P] Create @agentx/github-agent at packages/agents/github-agent/ - agent.yaml (GitHub MCP server), system-prompt.md (PR/issue assistant), README.md
- [ ] T116 [P] Create @agentx/data-analyst at packages/agents/data-analyst/ - agent.yaml (filesystem MCP), system-prompt.md (CSV/JSON analysis), README.md
- [ ] T117 [P] Create @agentx/slack-agent at packages/agents/slack-agent/ - agent.yaml (Slack MCP server), system-prompt.md (messaging assistant), README.md
- [ ] T118 [P] Create @agentx/code-reviewer at packages/agents/code-reviewer/ - agent.yaml (GitHub + filesystem MCP), system-prompt.md (code review), README.md

**Checkpoint**: 5 polished starter agents ready for publish at launch

---

## Phase 11: Telemetry

**Purpose**: Anonymous, opt-in usage telemetry

- [ ] T119 [US1] Implement telemetry reporter at packages/cli/src/telemetry/reporter.ts - sendTelemetry(event: TelemetryEvent), respect telemetry config flag, fire-and-forget (no blocking)
- [ ] T120 [US1] Implement POST /api/v1/telemetry route at packages/web/src/app/api/v1/telemetry/route.ts - insert telemetry event, rate limit
- [ ] T121 [US1] Integrate telemetry into runner.ts - report success/failure/duration after agent run

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T122 [P] Create comprehensive root README.md with install instructions, feature overview, demo GIF placeholder, badges
- [ ] T123 [P] Create CONTRIBUTING.md with development setup, testing, PR guidelines
- [ ] T124 Implement `agentx config` command at packages/cli/src/commands/config.ts for managing global config
- [ ] T125 Wire config command into packages/cli/src/index.ts
- [ ] T126 Add --help text to all CLI commands with examples
- [ ] T127 Add --version flag reading from package.json
- [ ] T128 [P] Implement --verbose and --debug flags as global options in packages/cli/src/index.ts
- [ ] T129 End-to-end test: install -> configure -> run -> uninstall lifecycle
- [ ] T130 Security audit: verify secret encryption, temp file cleanup, permission warnings
- [ ] T131 Performance profiling: measure install time, run startup time, search latency
- [ ] T132 Run quickstart.md validation - follow all steps and verify they work
- [ ] T133 Prepare npm publish configuration in packages/cli/package.json (files, bin, repository, keywords)
- [ ] T134 Verify Vercel deployment of packages/web/ with all environment variables
- [ ] T135 Publish 5 starter agents to the live registry

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US1 - Run Agent (Phase 3)**: Depends on Phase 2 - core MVP, no registry dependency
- **US7 - Configure Secrets (Phase 4)**: Depends on Phase 2 - enables US1 for agents with secrets
- **US5 - Scaffold/Test (Phase 5)**: Depends on Phase 2 - enables agent creation
- **US4 - Publish (Phase 6)**: Depends on Phase 2 + Registry Backend setup - enables US2
- **US2 - Install (Phase 7)**: Depends on Phase 6 (needs published agents to install)
- **US3 - Search (Phase 8)**: Depends on Phase 6 (needs agents in registry to search)
- **US6 - Website (Phase 9)**: Depends on Phase 6 (needs registry API and data)
- **Starter Agents (Phase 10)**: Depends on Phase 5 (validate) + Phase 6 (publish)
- **Telemetry (Phase 11)**: Depends on Phase 3 (runner integration)
- **Polish (Phase 12)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (Run)**: Can start after Phase 2 - No dependencies on other stories (works with local agents)
- **US7 (Configure)**: Can start after Phase 2 - Enhances US1 but US1 works without it (agents without secrets)
- **US5 (Scaffold/Test)**: Can start after Phase 2 - Independent of all other stories
- **US4 (Publish)**: Can start after Phase 2 - Requires registry backend setup (included in Phase 6)
- **US2 (Install)**: Depends on US4 (needs published agents) - Can use mock data for development
- **US3 (Search)**: Depends on US4 (needs agents in registry) - Can use mock data for development
- **US6 (Website)**: Depends on registry API routes from US4/US2/US3

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Types/schemas before models/services
- Services before commands
- Commands before CLI wiring
- Story complete before moving to next priority

### Parallel Opportunities

- All Phase 1 Setup tasks marked [P] can run in parallel
- All Phase 2 Foundational tasks marked [P] can run in parallel
- US1, US7, and US5 can run in parallel after Phase 2 (different files, no dependencies)
- Within each story, tests marked [P] can run in parallel
- All 5 starter agents (Phase 10) can run in parallel
- Website components marked [P] in Phase 9 can run in parallel
- Documentation tasks marked [P] can run in parallel

---

## Parallel Example: Phase 2 Foundational

```bash
# These can all run in parallel (different files):
Task: "Create color utilities at packages/cli/src/ui/colors.ts"
Task: "Create spinner utility at packages/cli/src/ui/spinner.ts"
Task: "Create table utility at packages/cli/src/ui/table.ts"
Task: "Create registry types at packages/cli/src/types/registry.ts"
Task: "Create config types at packages/cli/src/types/config.ts"
```

## Parallel Example: After Phase 2

```bash
# These three stories can start in parallel:
# Developer A: US1 (Run Agent) - packages/cli/src/runtime/*
# Developer B: US7 (Configure Secrets) - packages/cli/src/secrets/*
# Developer C: US5 (Scaffold/Test) - packages/cli/src/commands/init.ts, validate.ts, test.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (Run Agent)
4. **STOP and VALIDATE**: Test running a local agent end-to-end
5. This alone delivers value: users can create and run local agents

### Incremental Delivery

1. Setup + Foundational -> Foundation ready
2. US1 (Run) -> Local agents work (MVP!)
3. US7 (Configure) -> Agents with secrets work
4. US5 (Scaffold) -> Agent creation workflow works
5. US4 (Publish) -> Registry backend live, creators can publish
6. US2 (Install) -> Users can install from registry
7. US3 (Search) -> Discovery via CLI
8. US6 (Website) -> Discovery via web
9. Starter Agents -> 5 polished agents published
10. Polish -> Production ready, launch

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Run) + US7 (Configure) - runtime + secrets
   - Developer B: US5 (Scaffold) + US4 (Publish) - creation pipeline
3. Once US4 (Publish) registry backend is ready:
   - Developer A: US2 (Install) + US3 (Search) - consumer pipeline
   - Developer B: US6 (Website) - web marketplace
4. Developer C (any time after US5): Starter Agents

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All file paths are relative to repository root
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Total tasks: 135
- Critical path: Setup -> Foundational -> US1 (Run) -> US4 (Publish backend) -> US2 (Install) -> Launch
