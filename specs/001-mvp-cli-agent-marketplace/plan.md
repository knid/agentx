# Implementation Plan: MVP CLI Agent Marketplace

**Branch**: `1-mvp-cli-agent-marketplace` | **Date**: 2026-02-06 | **Spec**: specs/1-mvp-cli-agent-marketplace/spec.md
**Input**: Feature specification from `specs/1-mvp-cli-agent-marketplace/spec.md`

## Summary

Build the agentx MVP: a CLI tool (npm package) that lets developers install, run, and publish AI agents powered by Claude Code, backed by a Next.js registry/website at agentx.dev. The CLI spawns the user's claude CLI as a subprocess with agent-defined system prompts and MCP configurations. The registry stores agent metadata in Neon PostgreSQL and agent tarballs in Cloudflare R2.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js >= 18
**Primary Dependencies (CLI)**: Commander.js, execa, clack, Zod, yaml (npm), ofetch, tsup
**Primary Dependencies (Web)**: Next.js 15 (App Router), Drizzle ORM, @neondatabase/serverless, @upstash/redis, @aws-sdk/client-s3 (for R2)
**Storage**: Neon PostgreSQL (remote), Cloudflare R2 (tarballs), local filesystem (~/.agentx/)
**Testing**: Vitest (CLI), Next.js built-in testing (Web)
**Target Platform**: macOS, Linux (CLI); Vercel (Web)
**Project Type**: Multi-package (CLI + Web + Agents)
**Performance Goals**: Agent install < 5s, agent run startup < 2s, search < 1s, publish < 10s
**Constraints**: All infrastructure within free tiers, no paid APIs, no embedded LLM calls
**Scale/Scope**: 5K monthly users at launch, 100+ agents in registry, 5 starter agents

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. CLI-First | PASS | CLI is the primary deliverable; web is secondary |
| II. Zero-Cost | PASS | All services on free tiers (Vercel, Neon, R2, Upstash) |
| III. npm Model | PASS | Scoped packages, semver, install/publish/search commands |
| IV. Claude Code Native | PASS | Runtime spawns claude CLI; no embedded LLM calls |
| V. Security by Default | PASS | AES-256-GCM secrets, SHA-256 verification, permission declarations |
| VI. Test-Driven | PASS | Vitest for CLI, tests before implementation |
| VII. Simplicity | PASS | Minimal agent spec format, convention over configuration |

## Project Structure

### Documentation (this feature)

```text
specs/1-mvp-cli-agent-marketplace/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
│   └── registry-api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
# CLI Package
packages/cli/
├── src/
│   ├── index.ts                     # Entry point, Commander program setup
│   ├── commands/
│   │   ├── run.ts                   # agentx run <agent> [prompt]
│   │   ├── install.ts               # agentx install <agent>
│   │   ├── uninstall.ts             # agentx uninstall <agent>
│   │   ├── list.ts                  # agentx list
│   │   ├── update.ts                # agentx update [agent | --all]
│   │   ├── search.ts                # agentx search <query>
│   │   ├── info.ts                  # agentx info <agent>
│   │   ├── trending.ts              # agentx trending
│   │   ├── init.ts                  # agentx init
│   │   ├── test.ts                  # agentx test
│   │   ├── validate.ts              # agentx validate
│   │   ├── publish.ts               # agentx publish
│   │   ├── configure.ts             # agentx configure <agent>
│   │   ├── login.ts                 # agentx login
│   │   ├── logout.ts                # agentx logout
│   │   ├── whoami.ts                # agentx whoami
│   │   ├── doctor.ts                # agentx doctor
│   │   └── config.ts                # agentx config
│   ├── runtime/
│   │   ├── runner.ts                # Core agent execution engine
│   │   ├── mcp-builder.ts           # Build temp MCP config from agent.yaml
│   │   ├── prompt-processor.ts      # Template variable injection for system prompts
│   │   ├── pipe-handler.ts          # Handle stdin piping
│   │   └── output-formatter.ts      # Format agent output (text, json, stream)
│   ├── registry/
│   │   ├── client.ts                # HTTP client for registry API
│   │   ├── search.ts                # Search/trending logic
│   │   ├── download.ts              # Download + verify + extract tarballs
│   │   └── publish.ts               # Create tarball + upload
│   ├── auth/
│   │   ├── github-oauth.ts          # GitHub OAuth browser flow
│   │   └── token-store.ts           # Read/write ~/.agentx/auth.json
│   ├── secrets/
│   │   ├── encrypt.ts               # AES-256-GCM encrypt/decrypt
│   │   ├── store.ts                 # Read/write ~/.agentx/secrets/*.enc.json
│   │   └── configure-flow.ts        # Interactive secret configuration (clack)
│   ├── config/
│   │   ├── global-config.ts         # ~/.agentx/config.yaml management
│   │   ├── agent-config.ts          # Per-agent config management
│   │   └── paths.ts                 # All filesystem path constants
│   ├── schemas/
│   │   ├── agent-yaml.ts            # Zod schema for agent.yaml
│   │   └── config.ts                # Zod schema for global/agent config
│   ├── templates/
│   │   └── basic/                   # Template for agentx init
│   │       ├── agent.yaml
│   │       ├── system-prompt.md
│   │       ├── README.md
│   │       └── LICENSE
│   ├── ui/
│   │   ├── spinner.ts               # Loading spinners
│   │   ├── table.ts                 # Table formatting
│   │   └── colors.ts                # Color constants, --no-color support
│   ├── telemetry/
│   │   └── reporter.ts              # Anonymous telemetry (opt-in)
│   ├── utils/
│   │   ├── semver.ts                # Version comparison utilities
│   │   ├── hash.ts                  # SHA-256 hashing
│   │   ├── tar.ts                   # Tarball creation and extraction
│   │   ├── validate.ts              # Validation helpers
│   │   └── errors.ts                # Custom error classes
│   └── types/
│       ├── agent.ts                 # Agent type definitions
│       ├── registry.ts              # Registry API response types
│       └── config.ts                # Config type definitions
├── test/
│   ├── commands/
│   │   ├── run.test.ts
│   │   ├── install.test.ts
│   │   ├── publish.test.ts
│   │   └── search.test.ts
│   ├── runtime/
│   │   ├── runner.test.ts
│   │   ├── mcp-builder.test.ts
│   │   └── prompt-processor.test.ts
│   ├── secrets/
│   │   └── encrypt.test.ts
│   ├── schemas/
│   │   └── agent-yaml.test.ts
│   └── fixtures/
│       ├── valid-agent/
│       │   ├── agent.yaml
│       │   └── system-prompt.md
│       └── invalid-agent/
│           └── agent.yaml
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── README.md
└── LICENSE

# Web/Registry Package
packages/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Landing page
│   │   ├── (marketing)/
│   │   │   └── page.tsx             # Hero + featured agents
│   │   ├── agents/
│   │   │   ├── page.tsx             # Browse/search agents
│   │   │   └── [scope]/
│   │   │       └── [name]/
│   │   │           └── page.tsx     # Agent detail page
│   │   ├── categories/
│   │   │   └── [category]/
│   │   │       └── page.tsx         # Category listing
│   │   ├── users/
│   │   │   └── [username]/
│   │   │       └── page.tsx         # Creator profile
│   │   ├── docs/
│   │   │   ├── page.tsx             # Docs index
│   │   │   └── [...slug]/
│   │   │       └── page.tsx         # Doc pages
│   │   └── api/
│   │       └── v1/
│   │           ├── agents/
│   │           │   ├── route.ts                    # GET (list/search), PUT (publish)
│   │           │   └── [scope]/
│   │           │       └── [name]/
│   │           │           ├── route.ts            # GET (info), DELETE (unpublish)
│   │           │           ├── versions/
│   │           │           │   └── route.ts        # GET (version list)
│   │           │           └── download/
│   │           │               └── [version]/
│   │           │                   └── route.ts    # GET (download tarball)
│   │           ├── search/
│   │           │   └── route.ts                    # GET (full-text search)
│   │           ├── trending/
│   │           │   └── route.ts                    # GET (trending)
│   │           ├── categories/
│   │           │   └── route.ts                    # GET (categories)
│   │           ├── auth/
│   │           │   ├── github/
│   │           │   │   └── route.ts                # POST (initiate OAuth)
│   │           │   └── callback/
│   │           │       └── route.ts                # GET (OAuth callback)
│   │           ├── users/
│   │           │   └── [username]/
│   │           │       └── route.ts                # GET (user profile)
│   │           └── telemetry/
│   │               └── route.ts                    # POST (anonymous telemetry)
│   ├── components/
│   │   ├── AgentCard.tsx
│   │   ├── AgentSearch.tsx
│   │   ├── InstallCommand.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── CategoryBadge.tsx
│   └── lib/
│       ├── db/
│       │   ├── schema.ts            # Drizzle schema
│       │   ├── index.ts             # DB connection
│       │   └── migrations/          # Drizzle migrations
│       ├── auth/
│       │   └── github.ts            # GitHub OAuth helpers
│       ├── storage/
│       │   └── r2.ts                # Cloudflare R2 client
│       └── utils/
│           ├── rate-limit.ts        # Upstash rate limiting
│           └── validation.ts        # Server-side validation
├── content/
│   └── docs/
│       ├── getting-started.mdx
│       ├── creating-agents.mdx
│       └── agent-yaml-reference.mdx
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── tsconfig.json
└── README.md

# Official Starter Agents
packages/agents/
├── gmail-agent/
│   ├── agent.yaml
│   ├── system-prompt.md
│   ├── README.md
│   └── LICENSE
├── github-agent/
├── data-analyst/
├── slack-agent/
└── code-reviewer/

# Root
├── package.json              # Workspace root (npm workspaces)
├── turbo.json                # Turborepo config (optional, for build orchestration)
├── tsconfig.base.json        # Shared TS config
├── .github/
│   └── workflows/
│       ├── ci.yml            # Test + lint on PR
│       └── release.yml       # npm publish on tag
├── README.md
└── LICENSE
```

**Structure Decision**: Multi-package monorepo using npm workspaces. The CLI (`packages/cli`) and web (`packages/web`) are separate packages that can be built and deployed independently. The agents (`packages/agents`) directory contains official starter agents. This structure allows independent versioning and deployment while sharing a common development workflow.

## Complexity Tracking

No constitution violations requiring justification.

## Phase 0: Research Decisions

### Decision 1: Monorepo vs Separate Repos

- **Decision**: Monorepo with npm workspaces
- **Rationale**: Simplifies development workflow, shared TypeScript config, atomic commits across CLI+web changes. No build dependency between CLI and web (they communicate via HTTP API), so a lightweight workspace setup suffices.
- **Alternatives considered**: Separate repos (rejected: increases context switching, harder to keep API contracts in sync during rapid MVP development).

### Decision 2: Agent Tarball Format

- **Decision**: Standard .tar.gz created with Node.js tar module
- **Rationale**: Same format npm uses, well-understood, broad tooling support. Includes agent.yaml, system-prompt.md, README.md, prompts/, tools/ directories.
- **Alternatives considered**: zip (rejected: tar.gz is the npm convention and has smaller size), git clone (rejected: requires git, slower, no versioning control).

### Decision 3: Secret Encryption Key Derivation

- **Decision**: scrypt(machineId, 'agentx-salt', 32) producing a 256-bit key
- **Rationale**: Machine ID ties secrets to the specific machine, preventing portability of encrypted secrets (which is a security feature). scrypt is the recommended KDF for this use case.
- **Alternatives considered**: PBKDF2 (acceptable but scrypt is more memory-hard), user password (rejected: adds friction, users would forget), keychain integration (rejected: adds platform-specific complexity, violates Principle VII).

### Decision 4: GitHub OAuth Flow for CLI

- **Decision**: Device Authorization flow (open browser, callback to local server, exchange code for token)
- **Rationale**: Standard pattern for CLI tools authenticating with OAuth providers. Used by gh CLI, Vercel CLI, etc.
- **Alternatives considered**: Personal access tokens (rejected: poor UX, manual copy-paste), SSH keys (rejected: GitHub OAuth gives us user identity).

### Decision 5: Package Scope Convention

- **Decision**: @username/agent-name format, mirroring npm scopes
- **Rationale**: Prevents name collisions, establishes ownership, familiar to npm users. @agentx/ scope reserved for official starter agents.
- **Alternatives considered**: Flat naming (rejected: collision risk), org-based only (rejected: limits individual creators).

## Phase 1: Design Artifacts

### Data Model

See `specs/1-mvp-cli-agent-marketplace/data-model.md` for full entity definitions.

Core entities: users, agents, agent_versions, stars, downloads, telemetry.

### API Contracts

See `specs/1-mvp-cli-agent-marketplace/contracts/registry-api.md` for full API specification.

Base URL: `https://registry.agentx.dev/api/v1`

Key endpoints:
- `GET /agents?q=&category=&sort=&page=` - List/search agents
- `GET /agents/:scope/:name` - Agent info
- `GET /agents/:scope/:name/download/:version` - Download tarball
- `PUT /agents/:scope/:name` - Publish agent (authenticated)
- `GET /search?q=&limit=20` - Full-text search
- `GET /trending?period=week` - Trending agents
- `POST /auth/github` - Initiate GitHub OAuth
- `GET /auth/callback` - GitHub OAuth callback

### Quickstart

See `specs/1-mvp-cli-agent-marketplace/quickstart.md` for the user-facing quickstart guide.
