# Spec-Kit Constitution Prompt for agentx

Use this prompt with `/speckit.constitution` to generate or update the project constitution.

---

## Prompt

```
agentx is a CLI-first AI agent marketplace -- "npm for AI agents, powered by Claude Code." It is a fully open-source (MIT), free-forever tool that lets developers install, run, and share pre-packaged AI agents from their terminal using their existing Claude Pro/Max subscription. No API keys needed, no SaaS, no monetization.

Create a constitution with 7 core principles:

I. CLI-First, Always
- Every feature MUST work from the command line before any web interface.
- The CLI is the primary interface; the website (agentx.dev) is a discovery complement only.
- All agent operations (install, run, configure, publish) MUST be terminal-completable.
- Use clack for interactive prompts. Respect --no-color and --quiet flags.

II. Zero-Cost User Experience
- No API key, paid account, or agentx subscription required. Users' Claude subscription is the only cost.
- All infrastructure MUST operate within free tiers: Vercel, Neon PostgreSQL, Cloudflare R2, Upstash Redis.
- No premium tiers, paywalls, or monetized features. MIT licensed, free forever.

III. npm Model for Distribution
- Agents are packages: manifest (agent.yaml), semver versioned, scoped (@scope/name), installed locally.
- CLI commands (install, uninstall, publish, search, list) MUST behave as developers expect from npm/yarn/pnpm.

IV. Claude Code Native
- agentx spawns the user's `claude` CLI as a subprocess with system prompts and MCP configurations.
- MUST NOT embed any LLM logic or API calls. All AI reasoning is delegated to claude CLI.
- MCP servers are the mechanism for agent capabilities. Agent spec designed around Claude Code's interface.

V. Security by Default
- Agent permissions declared in agent.yaml, shown to users before install.
- Secrets encrypted at rest (AES-256-GCM, machine-derived key). Temp MCP configs cleaned up in finally blocks.
- No user data/prompts/secrets sent to registry. Automated scanning for hardcoded secrets on publish.

VI. Test-Driven Development
- TDD: tests before implementation, Vitest for CLI. Test suite MUST pass before PR merge.
- Agent validation (agentx validate, agentx test) verifies schema, system-prompt.md, MCP server startability.
- Integration tests cover critical path: install -> configure -> run -> uninstall.

VII. Simplicity and Convention Over Configuration
- YAGNI. agent.yaml is single source of truth. Sensible defaults for all optional config.
- agentx init produces a working agent with zero additional setup.
- Error messages are actionable (tell users exactly what to do next).

Technology Stack:
- CLI: TypeScript, Commander.js, clack, Zod, execa, ofetch, yaml, tsup, Vitest
- Web: Next.js 15 App Router, Drizzle ORM, Neon PostgreSQL, Upstash Redis, Cloudflare R2
- Auth: GitHub OAuth
- PROHIBITIONS: No Electron/GUI, no webpack, no Express/Fastify, no MongoDB, no embedded LLM calls, no paid services

Architecture Boundaries:
- Local: CLI process, agent files, encrypted secrets, claude subprocess, MCP servers, temp files
- Remote: Registry API, PostgreSQL, R2 storage, web UI, GitHub OAuth, telemetry ingestion
- CLI contacts registry ONLY for install/search/publish/login/telemetry. Run is fully offline.
- SHA-256 verification on all downloads. Telemetry is opt-in and anonymous.

Development Workflow: Feature branches, conventional commits, ESLint + Prettier, semantic versioning, GitHub Actions CI/CD.
```

---

## Expected Output

The constitution should be written to `.specify/memory/constitution.md` with:
- All 7 principles with declarative, testable language (MUST/SHOULD)
- Technology Stack Constraints tables for CLI and Web
- Technology Prohibitions list
- Architecture Boundaries with local/remote separation
- Security & Privacy Requirements
- Development Workflow section
- Governance section with amendment procedure
- Version: 1.0.0, Ratified: today's date
