<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 -> 1.0.0
  Modified principles: N/A (initial creation)
  Added sections:
    - Core Principles (I through VII)
    - Technology Stack Constraints
    - Architecture Boundaries
    - Security & Privacy Requirements
    - Development Workflow
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md: N/A (generic template)
    - .specify/templates/spec-template.md: N/A (generic template)
    - .specify/templates/tasks-template.md: N/A (generic template)
  Follow-up TODOs: None
-->

# agentx Constitution

## Core Principles

### I. CLI-First, Always

agentx is a terminal-native tool. Every feature MUST work from the command line before any web interface is considered. The CLI is the primary interface; the website is a discovery complement, never a replacement. All agent operations (install, run, configure, publish) MUST be completable entirely from the terminal. Terminal output MUST be beautiful, informative, and respect `--no-color` and `--quiet` flags. Interactive prompts MUST use clack for consistency.

### II. Zero-Cost User Experience

Users MUST NOT need an API key, paid account, or any agentx-specific subscription. Agents run on the user's existing Claude CLI subscription. The registry, website, and all infrastructure MUST operate within free tiers (Vercel, Neon, Cloudflare R2, Upstash). There MUST be no premium tiers, paywalls, or monetized features. The project is MIT licensed, free forever.

### III. npm Model for Distribution

agentx follows the npm package manager paradigm. Agents are packages with a manifest (agent.yaml), versioned with semver, scoped to authors (@scope/name), published to a central registry, and installed locally. The CLI MUST feel familiar to anyone who has used npm, yarn, or pnpm. Commands like `install`, `uninstall`, `publish`, `search`, and `list` MUST behave as developers expect from package managers.

### IV. Claude Code Native

agentx is built specifically for Claude Code (the `claude` CLI). The runtime engine spawns `claude` as a subprocess with system prompts, MCP configurations, and user prompts. agentx MUST NOT embed its own LLM logic or API calls. All AI reasoning is delegated to the user's Claude CLI. MCP server configurations are the primary mechanism for giving agents capabilities. The agent spec format (agent.yaml + system-prompt.md) MUST be designed around Claude Code's interface.

### V. Security by Default

Agent permissions (filesystem, network, execute_commands) MUST be declared in agent.yaml and shown to users before installation. Secrets MUST be encrypted at rest using AES-256-GCM with machine-derived keys. Temporary MCP config files containing secrets MUST be cleaned up after agent execution. No user data, prompts, or secrets are ever sent to the agentx registry. Automated scanning MUST check for hardcoded secrets on publish. All agent code is open source and visible.

### VI. Test-Driven Development

All features MUST have tests written before implementation (red-green-refactor). Vitest is the test framework for the CLI. The test suite MUST pass before any PR is merged. Agent validation (`agentx validate`, `agentx test`) MUST verify agent.yaml schema, system-prompt.md presence, and MCP server startability. Integration tests MUST cover the critical path: install -> configure -> run -> uninstall.

### VII. Simplicity and Convention Over Configuration

Start simple, add complexity only when proven necessary (YAGNI). The agent spec format MUST be minimal but extensible. agent.yaml MUST be the single source of truth for an agent's configuration. Sensible defaults MUST be provided for all optional configuration. The `agentx init` scaffold MUST produce a working agent with zero additional setup. Error messages MUST be actionable, telling users exactly what to do next.

## Technology Stack Constraints

### CLI Package (npm: `agentx`)

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Language | TypeScript (strict mode) | Type safety, ecosystem familiarity |
| CLI Framework | Commander.js | Mature, well-documented, standard |
| Terminal UI | clack | Beautiful prompts, minimal footprint |
| HTTP Client | ofetch | Lightweight, modern fetch wrapper |
| YAML Parser | yaml (npm) | Parse agent.yaml manifests |
| Encryption | Node.js crypto (AES-256-GCM) | Native, no extra dependencies for secrets |
| Process Spawn | execa | Reliable subprocess management for claude CLI |
| Bundler | tsup | Fast TypeScript bundling |
| Validation | Zod | Runtime schema validation for agent.yaml |
| Testing | Vitest | Fast, TypeScript-native test runner |

### Registry & Website (agentx.dev)

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | Next.js 15 (App Router) | SSR + API routes in one deployment |
| Database | PostgreSQL via Neon (free tier) | Relational data, full-text search |
| ORM | Drizzle ORM | Type-safe, lightweight, great DX |
| Cache | Upstash Redis (free tier) | Rate limiting, session cache |
| Object Storage | Cloudflare R2 (free tier) | Agent package tarballs |
| Auth | GitHub OAuth | Target audience lives on GitHub |
| Search | PostgreSQL full-text search (tsvector) | No extra service needed |
| Analytics | PostHog (free tier) | Usage statistics, opt-in |
| Hosting | Vercel (free tier) | Zero-config Next.js deployment |
| CDN/DNS | Cloudflare (free tier) | Global CDN for R2 assets |

### Technology Prohibitions

- MUST NOT add an ORM to the CLI package (only the web/registry uses Drizzle)
- MUST NOT use any paid service or API in the core product
- MUST NOT embed LLM API calls; all AI goes through user's Claude CLI
- MUST NOT use Electron, Tauri, or any GUI framework; this is a terminal tool
- MUST NOT use webpack; tsup is the bundler
- MUST NOT use Express or Fastify; Next.js API routes handle the backend
- MUST NOT use MongoDB, Firebase, or NoSQL databases

## Architecture Boundaries

### System Boundary: Local vs Remote

The system has a strict boundary between what runs locally on the user's machine and what runs on the agentx.dev infrastructure.

**Local (User's Machine)**:
- agentx CLI process
- Agent files (~/.agentx/agents/)
- Encrypted secrets (~/.agentx/secrets/)
- Claude CLI subprocess
- MCP server processes
- Temporary MCP config files

**Remote (agentx.dev Infrastructure)**:
- Agent registry API (Next.js API routes)
- Agent metadata database (Neon PostgreSQL)
- Agent package storage (Cloudflare R2)
- Web marketplace UI (Next.js SSR)
- GitHub OAuth callback handler
- Anonymous telemetry ingestion

### Communication Rules

- CLI contacts the registry ONLY for: install, search, publish, login, telemetry
- Agent execution (run) MUST work fully offline after installation
- All CLI-to-registry communication MUST use HTTPS
- All downloads MUST be verified with SHA-256 checksums
- Telemetry MUST be opt-in, anonymous, and contain no user data or prompts

### Repository Structure

The project is organized as separate packages within a monorepo or as independent repositories:

- `agentx` (CLI) - npm package, the primary deliverable
- `agentx-web` (Registry + Website) - Vercel deployment
- `agents` (Official starter agents) - monorepo of @agentx/* agents

### Data Flow Invariants

1. **Install flow**: CLI -> Registry API -> R2 CDN -> Local extraction (with SHA-256 verification)
2. **Run flow**: Local only. Load agent.yaml -> decrypt secrets -> build temp MCP config -> spawn claude CLI -> stream output -> cleanup
3. **Publish flow**: CLI -> Registry API (authenticated) -> R2 upload -> DB metadata update
4. **Auth flow**: CLI -> Browser -> GitHub OAuth -> agentx.dev callback -> token -> ~/.agentx/auth.json

## Security & Privacy Requirements

1. Secrets MUST be encrypted with AES-256-GCM using a key derived from machine ID via scrypt
2. Temporary files containing secrets MUST be deleted in a `finally` block
3. Agent manifests MUST declare permissions (filesystem, network, execute_commands)
4. Users MUST be warned about requested permissions before agent installation
5. Published agents MUST be scanned for hardcoded secrets and API keys
6. agent.yaml schema MUST be validated with Zod before publish is accepted
7. No user prompts, agent outputs, or personal data are transmitted to the registry
8. Telemetry events contain only: agent name, version, success/failure, duration, OS, CLI version
9. All agent source code is open and inspectable by the community

## Development Workflow

1. **Branching**: Feature branches from main, PRs required for merge
2. **Testing**: All PRs MUST pass the full Vitest suite
3. **Linting**: ESLint + Prettier, enforced via pre-commit hooks
4. **Commits**: Conventional commits (feat:, fix:, docs:, chore:, etc.)
5. **Releases**: Semantic versioning, GitHub releases trigger npm publish via Actions
6. **Code Review**: All PRs require at least one review before merge
7. **Documentation**: Every public API and CLI command MUST have documentation

## Governance

This constitution supersedes all other project practices and conventions. Amendments require:

1. A documented rationale for the change
2. Impact analysis on existing features and agents
3. Update to this constitution with version increment
4. Propagation of changes to all dependent specs and plans

Version increments follow semantic versioning:
- MAJOR: Removal or redefinition of a core principle
- MINOR: Addition of new principles, sections, or material expansion
- PATCH: Clarifications, wording improvements, non-semantic refinements

All PRs and code reviews MUST verify compliance with this constitution. Complexity additions MUST be justified against Principle VII (Simplicity).

**Version**: 1.0.0 | **Ratified**: 2026-02-06 | **Last Amended**: 2026-02-06
