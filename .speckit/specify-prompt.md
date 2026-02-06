# Spec-Kit Specify Prompt for agentx

Use this prompt with `/speckit.specify` to generate the feature specification.

---

## Prompt

```
Build the agentx MVP -- a CLI-first AI agent marketplace that lets developers install, run, and publish AI agents powered by Claude Code. The MVP includes the CLI tool, agent runtime engine, registry backend, and web marketplace.

The system has 7 user stories in priority order:

US1 (P1): Run a Local Agent from the Terminal
- User runs `agentx run <agent> "prompt"` and agentx loads agent.yaml, builds temp MCP config with resolved secrets, spawns claude CLI with --system-prompt and --mcp-config flags, streams output to terminal.
- Supports: stdin piping (cat file | agentx run agent "analyze"), --file flag, --interactive (-i) mode, --json output, --quiet, --debug flags.
- Claude CLI is spawned via execa. Non-interactive: `-p "prompt"` with stdout pipe. Interactive: stdio inherit.
- System prompt template variables ({{config.key}}) replaced with user config or defaults.
- MCP config secret refs (${secrets.KEY}) resolved from encrypted secret store.
- Temp MCP config file written to tmpdir with UUID name, deleted in finally block.
- If claude CLI not found: actionable error with install instructions.

US2 (P2): Install an Agent from the Registry
- User runs `agentx install @scope/agent-name` and CLI downloads tarball from R2, verifies SHA-256, extracts to ~/.agentx/agents/.
- Warns if agent requires configuration (secrets declared in agent.yaml).
- `agentx list` shows installed agents table. `agentx uninstall` removes agent + secrets.
- `agentx update [agent | --all]` checks registry for newer versions, re-downloads.
- `agentx info @scope/name` fetches and displays detailed metadata from registry.

US3 (P3): Search and Discover Agents
- `agentx search <query>` queries registry full-text search (PostgreSQL tsvector), displays formatted results.
- `agentx trending` shows popular agents by download count within a time period.
- Supports category filtering: `agentx search email --category productivity`.
- Friendly empty-result message with suggestion to browse agentx.dev.

US4 (P4): Publish an Agent to the Registry
- `agentx login` triggers GitHub OAuth (browser -> callback -> token -> ~/.agentx/auth.json).
- `agentx publish` validates agent.yaml, creates .tar.gz tarball, uploads to registry API.
- Registry API validates, stores tarball in R2, updates PostgreSQL (agents + agent_versions tables).
- Scope enforcement: users can only publish under @their-username.
- `agentx whoami` shows auth status. `agentx logout` clears token.

US5 (P5): Scaffold and Test a New Agent
- `agentx init` interactive wizard (clack) scaffolds agent directory: agent.yaml, system-prompt.md, README.md, LICENSE.
- `agentx validate` runs Zod schema validation on agent.yaml.
- `agentx test` runs validate + attempts MCP server startability check.
- `agentx doctor` checks system requirements (claude CLI, Node.js, agentx version, auth status).

US6 (P6): Browse Agents on agentx.dev
- Landing page with hero, search bar, featured agents, categories.
- Agent browse page with pagination, search, category filters.
- Agent detail page with rendered README, install command (copy button), stats, examples, permissions, MCP servers.
- User profile page with avatar, bio, published agents.
- Documentation pages (getting started, creating agents, agent.yaml reference).
- Built with Next.js 15 App Router, SSR, Tailwind CSS.

US7 (P7): Configure Agent Secrets
- `agentx configure <agent>` walks through each declared secret with clack prompts.
- Secrets encrypted with AES-256-GCM, key derived from machine ID via scrypt.
- Stored at ~/.agentx/secrets/<agent>.enc.json.
- Run command decrypts and injects into MCP config at runtime.
- Error if agent requires secrets but configure hasn't been run.

Key entities: users, agents, agent_versions, stars, downloads, telemetry (remote DB); InstalledAgent, SecretStore, GlobalConfig, AuthToken (local filesystem).

Edge cases to cover: duplicate install, MCP server failure during run, registry unreachable, missing ~/.agentx/ directory, unset config variables, running non-installed agent, claude CLI version below minimum.

Functional requirements: FR-001 through FR-020 covering agent.yaml parsing, claude CLI spawning, template processing, secret resolution, tarball handling, SHA-256 verification, GitHub OAuth, encryption, full-text search, R2 storage, download tracking, SSR website, REST API, interactive mode, file input, scaffold, validation, directory init.

Success criteria: Install-to-run < 30s, init produces runnable scaffold, 5 starter agents at launch, search < 1s, secrets encrypted at rest, free tier for 5K MAU, 100% critical path tests pass, 90% first-run success rate, publish-to-available < 10s, npm install < 15s.
```

---

## Expected Output

A comprehensive spec.md file at `specs/1-mvp-cli-agent-marketplace/spec.md` with:
- 7 user stories with Given/When/Then acceptance scenarios
- Priority ordering (P1-P7) with rationale
- Independent testability for each story
- 20 functional requirements (FR-001 through FR-020)
- 7 key entities with attributes
- 7+ edge cases
- 10 measurable success criteria
