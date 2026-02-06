# Feature Specification: MVP CLI Agent Marketplace

**Feature Branch**: `1-mvp-cli-agent-marketplace`
**Created**: 2026-02-06
**Status**: Draft
**Input**: User description: "Build the agentx MVP -- a CLI-first AI agent marketplace that lets developers install, run, and publish AI agents powered by Claude Code. The MVP includes the CLI tool, agent runtime engine, registry backend, and web marketplace."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run a Local Agent from the Terminal (Priority: P1)

A developer has created an agent locally (agent.yaml + system-prompt.md) and wants to run it against their Claude CLI subscription. They invoke `agentx run <agent> "do something"` and agentx loads the agent config, builds a temporary MCP configuration, spawns the claude CLI as a subprocess with the system prompt and MCP config, and streams the output back to the terminal. The user can also pipe input from stdin or pass a file.

**Why this priority**: This is the core value proposition. Without the ability to run agents, nothing else matters. If a user can create and run a local agent, agentx already delivers value even without a registry.

**Independent Test**: Can be fully tested by creating a minimal agent (agent.yaml + system-prompt.md with no MCP servers) and running `agentx run my-agent "hello"`. Verifiable by confirming claude CLI is spawned with the correct flags and output is streamed.

**Acceptance Scenarios**:

1. **Given** an agent is installed at ~/.agentx/agents/my-agent/ with a valid agent.yaml and system-prompt.md, **When** the user runs `agentx run my-agent "summarize this"`, **Then** agentx spawns `claude -p "summarize this" --system-prompt <processed prompt> --mcp-config <temp file>` and streams stdout to the terminal.
2. **Given** an agent has MCP servers defined in agent.yaml with secret references (${secrets.TOKEN}), **When** the user runs the agent, **Then** agentx decrypts stored secrets, builds a resolved MCP config with real values, writes it to a temp file, and deletes the temp file after execution completes (including on error).
3. **Given** an agent has config variables (e.g., timezone, summary_style), **When** the system prompt contains `{{config.timezone}}`, **Then** agentx replaces template variables with values from the user's agent config before passing to claude.
4. **Given** the user pipes input via stdin (e.g., `cat file.csv | agentx run data-analyst "analyze"`), **When** the agent runs, **Then** the piped content is prepended to the prompt in a fenced code block.
5. **Given** the user passes `--interactive` or `-i`, **When** the agent runs, **Then** agentx spawns claude in interactive mode (stdio: inherit) instead of non-interactive mode.
6. **Given** the user passes `--json`, **When** the agent runs, **Then** agentx passes `--output-format json` to claude and the output is valid JSON.
7. **Given** the claude CLI is not installed or not found in PATH, **When** the user tries to run any agent, **Then** agentx shows an actionable error: "claude CLI not found. Install: npm install -g @anthropic-ai/claude-code".

---

### User Story 2 - Install an Agent from the Registry (Priority: P2)

A developer searches for an agent on the registry, finds one they want, and installs it with `agentx install @scope/agent-name`. The CLI downloads the agent package tarball from the registry, verifies its SHA-256 checksum, extracts it to ~/.agentx/agents/, and notifies the user if configuration is needed. The user can then list installed agents, get info, update, and uninstall.

**Why this priority**: Distribution is what makes agentx a marketplace, not just a local tool. Install is the gateway to the ecosystem. Once users can install agents, the network effect begins.

**Independent Test**: Can be tested by publishing a test agent to the registry, then running `agentx install @test/hello-agent` and verifying the agent files appear in ~/.agentx/agents/hello-agent/.

**Acceptance Scenarios**:

1. **Given** an agent `@agentx/gmail-agent@1.2.0` exists in the registry, **When** the user runs `agentx install @agentx/gmail-agent`, **Then** the CLI fetches metadata from the registry API, downloads the tarball from R2, verifies SHA-256, extracts to ~/.agentx/agents/gmail-agent/, and prints a success message with the installed version.
2. **Given** an agent requires secrets (declared in agent.yaml secrets section), **When** installation completes, **Then** the CLI warns: "This agent requires configuration. Run: agentx configure gmail-agent".
3. **Given** the user runs `agentx list`, **Then** a table of all installed agents is displayed showing name, version, description, and whether configuration is pending.
4. **Given** the user runs `agentx uninstall gmail-agent`, **Then** the agent directory is removed from ~/.agentx/agents/ and associated encrypted secrets are removed from ~/.agentx/secrets/.
5. **Given** the user runs `agentx update gmail-agent`, **When** a newer version exists in the registry, **Then** the CLI downloads and replaces the agent package, preserving user configuration and secrets.
6. **Given** the user runs `agentx update --all`, **Then** all installed agents with available updates are updated.
7. **Given** the user runs `agentx info @agentx/gmail-agent`, **Then** detailed agent metadata is displayed including description, version, author, download count, star count, MCP servers, permissions, and examples.
8. **Given** the downloaded tarball's SHA-256 hash does not match the registry's declared hash, **When** verification fails, **Then** installation is aborted with a security warning.

---

### User Story 3 - Search and Discover Agents (Priority: P3)

A developer wants to find agents for a specific task. They can search from the CLI with `agentx search <query>` or browse the agentx.dev website. Results show agent name, description, stars, downloads, and version. The CLI also supports `agentx trending` to see popular agents.

**Why this priority**: Discovery drives adoption. Users need a way to find agents before they can install them. The CLI search and trending commands are the immediate interface; the website is a secondary discovery channel.

**Independent Test**: Can be tested by having at least 3 agents in the registry and running `agentx search "email"` to verify relevant results are returned and formatted.

**Acceptance Scenarios**:

1. **Given** agents exist in the registry matching the query "email", **When** the user runs `agentx search email`, **Then** matching agents are displayed in a formatted table with name, description, star count, download count, and latest version.
2. **Given** the user runs `agentx trending`, **Then** agents sorted by download count in the past week are displayed.
3. **Given** the user runs `agentx search email --category productivity`, **Then** results are filtered to only productivity-category agents matching "email".
4. **Given** no agents match the query, **When** the user searches, **Then** a friendly message is shown: "No agents found for 'xyz'. Try a different search or browse at agentx.dev".

---

### User Story 4 - Publish an Agent to the Registry (Priority: P4)

An agent creator has built an agent locally, tested it with `agentx test`, and wants to share it with the community. They authenticate with `agentx login` (GitHub OAuth), then run `agentx publish` from the agent directory. The CLI validates the agent.yaml, creates a tarball, uploads it to the registry, and the agent becomes available for anyone to install.

**Why this priority**: Publishing is what creates the ecosystem. Without publishers, there is no marketplace. However, the core team can manually seed initial agents, so this is lower priority than running and installing.

**Independent Test**: Can be tested by creating a test agent, running `agentx login` with a test GitHub account, then `agentx publish`, and verifying the agent appears in registry search results.

**Acceptance Scenarios**:

1. **Given** the user is in a directory with a valid agent.yaml and system-prompt.md, **When** they run `agentx publish`, **Then** the CLI validates the manifest, creates a tarball, uploads to the registry API (authenticated), and prints the URL where the agent is now live.
2. **Given** the user is not authenticated, **When** they run `agentx publish`, **Then** they are prompted to run `agentx login` first.
3. **Given** the agent.yaml has validation errors (missing required fields, invalid semver version, etc.), **When** the user runs `agentx publish`, **Then** all validation errors are listed with specific fix instructions.
4. **Given** the user tries to publish under a scope that is not their username (e.g., @someone-else/agent), **When** they publish, **Then** the request is rejected with a 403 error: "You can only publish under @your-username".
5. **Given** the user runs `agentx login`, **Then** a browser opens to GitHub OAuth, and upon completion, the auth token is saved to ~/.agentx/auth.json.
6. **Given** the user runs `agentx whoami`, **Then** their GitHub username and auth status is displayed.

---

### User Story 5 - Scaffold and Test a New Agent (Priority: P5)

An agent creator wants to build a new agent from scratch. They run `agentx init` which walks them through an interactive setup (name, description, category, MCP servers, license) and scaffolds the complete agent directory structure. They can then run `agentx test` to validate the agent locally before publishing.

**Why this priority**: This lowers the barrier for agent creation, which grows the ecosystem. However, creators can manually create agent.yaml files following documentation, so the scaffold is a convenience.

**Independent Test**: Can be tested by running `agentx init`, filling in the interactive prompts, and verifying the output directory contains a valid agent.yaml, system-prompt.md, README.md, and LICENSE.

**Acceptance Scenarios**:

1. **Given** the user runs `agentx init`, **Then** an interactive prompt (using clack) asks for: agent name, description, category (select from list), MCP servers (multi-select from common ones), and license.
2. **Given** the user completes the init wizard, **Then** a directory is created with: agent.yaml (populated), system-prompt.md (template), README.md (template), LICENSE (selected license), and test/test-prompts.yaml.
3. **Given** the user runs `agentx test` in an agent directory, **Then** the CLI validates agent.yaml schema, checks system-prompt.md exists, and optionally attempts to start each declared MCP server.
4. **Given** the user runs `agentx validate` in an agent directory, **Then** only schema validation is performed (no MCP server startability check), and all errors/warnings are listed.
5. **Given** the user runs `agentx doctor`, **Then** the system checks: claude CLI installed and version, Node.js version >= 18, agentx version, auth status, and prints a status report.

---

### User Story 6 - Browse Agents on agentx.dev (Priority: P6)

A user visits agentx.dev to discover agents. They see a landing page with search, featured agents, and categories. They can browse agent detail pages showing README, install command, stats, and examples. They can also view creator profiles.

**Why this priority**: The website is a discovery complement to the CLI. It increases discoverability and provides a home for documentation. However, all functionality is also available via CLI commands.

**Independent Test**: Can be tested by deploying the website and verifying the landing page loads, agent search returns results, agent detail pages render with correct metadata, and the install command copy button works.

**Acceptance Scenarios**:

1. **Given** the user visits agentx.dev, **Then** they see a landing page with a search bar, featured agents, and category links.
2. **Given** the user searches for "github" on the website, **Then** matching agents are displayed as cards with name, description, stars, downloads, and install command.
3. **Given** the user clicks on an agent card, **Then** the agent detail page shows: full README (rendered markdown), install command (with copy button), version history, download count, star count, author info, MCP servers used, permissions required, and example prompts.
4. **Given** the user visits /users/username, **Then** the creator profile page shows: GitHub avatar, bio, and list of published agents.
5. **Given** the user visits /docs, **Then** documentation is available for: getting started, creating agents, agent.yaml spec reference, and MCP integration guide.

---

### User Story 7 - Configure Agent Secrets (Priority: P7)

A user installs an agent that requires API tokens or OAuth credentials. They run `agentx configure <agent>` which walks them through providing the required secrets. Secrets are encrypted and stored locally. When the agent runs, secrets are decrypted and injected into the MCP config.

**Why this priority**: This is required for agents with MCP servers that need authentication (Gmail, GitHub, Slack, etc.), but many simple agents (filesystem, data-analyst) work without secrets. The configure flow can be added incrementally.

**Independent Test**: Can be tested by installing an agent with a declared secret, running `agentx configure <agent>`, entering a test value, verifying the encrypted file exists at ~/.agentx/secrets/<agent>.enc.json, and running the agent to verify the secret is injected into the MCP config.

**Acceptance Scenarios**:

1. **Given** an agent declares secrets in agent.yaml (e.g., GMAIL_TOKEN with description "Gmail OAuth token"), **When** the user runs `agentx configure gmail-agent`, **Then** clack prompts guide the user through providing each secret.
2. **Given** the user provides a secret value, **Then** it is encrypted with AES-256-GCM using a machine-derived key and stored at ~/.agentx/secrets/gmail-agent.enc.json.
3. **Given** the user runs an agent that references ${secrets.GMAIL_TOKEN} in its MCP server env config, **When** the agent runs, **Then** the runtime decrypts the secret and replaces the reference with the real value in the temp MCP config file.
4. **Given** an agent requires secrets but the user has not run configure, **When** the user tries to run the agent, **Then** an error is shown: "Missing configuration. Run: agentx configure gmail-agent".

---

### Edge Cases

- What happens when the user installs the same agent twice? The second install should update if a newer version is available, or print "already installed at version X.Y.Z".
- What happens when an agent's MCP server fails to start during `agentx run`? The claude CLI handles this; agentx passes through stderr in debug mode.
- What happens when the registry is unreachable during install? A clear network error message is shown with retry suggestion.
- What happens when ~/.agentx/ directory does not exist? It is created on first use by any agentx command.
- What happens when an agent.yaml references a config variable that the user hasn't set? The default value from agent.yaml config section is used; if no default, an error is shown during run.
- What happens when the user tries to run an agent that is not installed? An error is shown: "Agent 'foo' not found. Install it with: agentx install foo".
- What happens when the user's Claude CLI version is below the agent's minimum requirement? A warning is shown before running.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST parse and validate agent.yaml manifests against a Zod schema covering all required fields (name, version, description, author) and optional fields (mcp_servers, secrets, config, permissions, examples, requires).
- **FR-002**: System MUST spawn the claude CLI as a subprocess with computed flags: `-p`, `--system-prompt`, `--mcp-config`, `--max-turns`, `--output-format`.
- **FR-003**: System MUST process system-prompt.md template variables by replacing `{{config.key}}` with user-configured or default values.
- **FR-004**: System MUST resolve MCP config secret references (`${secrets.KEY}`) by decrypting stored secrets and injecting real values into a temporary config file.
- **FR-005**: System MUST clean up all temporary files (MCP config) after agent execution, including on error, using a finally block.
- **FR-006**: System MUST support stdin piping by detecting piped input and prepending it to the prompt in a fenced code block.
- **FR-007**: System MUST create agent tarballs (.tar.gz) for publishing and extract them for installation.
- **FR-008**: System MUST verify SHA-256 checksums of downloaded tarballs before extraction.
- **FR-009**: System MUST implement GitHub OAuth flow: open browser -> callback -> store token at ~/.agentx/auth.json.
- **FR-010**: System MUST encrypt secrets with AES-256-GCM using scrypt-derived key from machine ID.
- **FR-011**: System MUST provide full-text search via PostgreSQL tsvector across agent name and description.
- **FR-012**: System MUST store agent tarballs in Cloudflare R2 and serve them via CDN URL.
- **FR-013**: System MUST track download counts per agent and per version.
- **FR-014**: System MUST render the agentx.dev website with server-side rendering via Next.js 15.
- **FR-015**: System MUST expose a RESTful API at /api/v1/ for all registry operations (search, install, publish, auth).
- **FR-016**: System MUST support interactive mode (-i) by spawning claude with stdio: inherit.
- **FR-017**: System MUST support --file flag by reading the file and prepending its content to the prompt.
- **FR-018**: System MUST scaffold new agent projects via `agentx init` with interactive prompts (clack).
- **FR-019**: System MUST validate agents via `agentx validate` (schema check) and `agentx test` (schema + MCP server check).
- **FR-020**: System MUST initialize the ~/.agentx/ directory structure on first use if it does not exist.

### Key Entities

- **User**: A GitHub-authenticated agent creator or consumer. Key attributes: github_id, username, display_name, email, avatar_url.
- **Agent**: A published agent package in the registry. Key attributes: scope, name, description, category, tags, latest_version, download_count, star_count, author relationship.
- **AgentVersion**: A specific published version of an agent. Key attributes: version (semver), tarball_url, tarball_sha256, tarball_size, agent_yaml (JSONB), published_at.
- **Star**: A user's bookmark of an agent. Composite key: user_id + agent_id.
- **Download**: A download event for analytics. Key attributes: agent_id, version, ip_hash, timestamp.
- **InstalledAgent** (local only): An agent extracted to ~/.agentx/agents/<name>/ with agent.yaml and system-prompt.md.
- **SecretStore** (local only): Encrypted JSON file at ~/.agentx/secrets/<agent>.enc.json containing key-value pairs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can install and run an agent in under 30 seconds (from `agentx install` to seeing agent output).
- **SC-002**: The `agentx init` command produces a valid, runnable agent scaffold with zero additional manual steps.
- **SC-003**: The system supports at least 5 published starter agents at launch (@agentx/gmail-agent, @agentx/github-agent, @agentx/data-analyst, @agentx/slack-agent, @agentx/code-reviewer).
- **SC-004**: Agent search returns relevant results within 1 second for queries against a registry with 100+ agents.
- **SC-005**: All agent secrets remain encrypted at rest and are only decrypted in memory during agent execution.
- **SC-006**: The registry and website operate within free tier limits for up to 5,000 monthly active users.
- **SC-007**: The full CLI test suite passes with 100% of critical path tests (install -> configure -> run -> uninstall).
- **SC-008**: 90% of new users can complete the first agent run (doctor -> search -> install -> run) without consulting documentation.
- **SC-009**: Agent publish-to-availability latency is under 10 seconds (from `agentx publish` to agent being installable).
- **SC-010**: The agentx npm package installs globally in under 15 seconds on a standard connection.
