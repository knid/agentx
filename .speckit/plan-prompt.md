# Spec-Kit Plan Prompt for agentx

Use this prompt with `/speckit.plan` to generate the implementation plan.

---

## Prompt

```
Create an implementation plan for the agentx MVP based on the feature specification at specs/1-mvp-cli-agent-marketplace/spec.md.

Technical Context:
- Language: TypeScript 5.x (strict mode), Node.js >= 18
- CLI deps: Commander.js, execa, clack, Zod, yaml, ofetch, tsup, Vitest
- Web deps: Next.js 15 (App Router), Drizzle ORM, @neondatabase/serverless, @upstash/redis, @aws-sdk/client-s3
- Storage: Neon PostgreSQL (remote), Cloudflare R2 (tarballs), local filesystem (~/.agentx/)
- Testing: Vitest (CLI), Next.js testing (Web)
- Platform: macOS + Linux (CLI), Vercel (Web)
- Project type: Multi-package monorepo (npm workspaces)
- Performance: install < 5s, run startup < 2s, search < 1s, publish < 10s
- Constraints: All free tiers, no paid APIs, no embedded LLM calls

Project structure should be a monorepo:
- packages/cli/ - The npm package (agentx), Commander.js entry point, commands/, runtime/, registry/, auth/, secrets/, config/, schemas/, templates/, ui/, telemetry/, utils/, types/
- packages/web/ - Next.js 15 app with API routes at app/api/v1/, components, lib/db/ (Drizzle schema + Neon), lib/auth/ (GitHub OAuth), lib/storage/ (R2 client), content/docs/ (MDX)
- packages/agents/ - Official starter agents (gmail-agent, github-agent, data-analyst, slack-agent, code-reviewer)

Key research decisions to document:
1. Monorepo (npm workspaces) vs separate repos - chose monorepo for simpler workflow
2. Tarball format (.tar.gz via tar npm package, same as npm itself)
3. Secret key derivation (scrypt from machine ID, 256-bit key)
4. GitHub OAuth flow (local HTTP server callback, like gh CLI)
5. Package scope convention (@username/agent-name, like npm scopes)
6. PostgreSQL FTS (tsvector/tsquery with GIN index, no extra search service)
7. Config variable injection ({{config.key}} regex replacement, no template engine)
8. R2 integration (via @aws-sdk/client-s3 S3-compatible API)

Design artifacts to generate:
- data-model.md with 6 remote entities (users, agents, agent_versions, stars, downloads, telemetry) and 4 local entities (InstalledAgent, SecretStore, GlobalConfig, AuthToken), including field types, constraints, indexes, relationships, and validation rules
- contracts/registry-api.md with full REST API specification for all endpoints (auth, agents, search, trending, categories, users, telemetry) including request/response formats, error codes, rate limiting
- research.md with all 8 research decisions including alternatives considered
- quickstart.md with end-to-end verification steps

Constitution check against 7 principles: CLI-First, Zero-Cost, npm Model, Claude Native, Security by Default, TDD, Simplicity.
```

---

## Expected Output

A comprehensive plan.md at `specs/1-mvp-cli-agent-marketplace/plan.md` with:
- Technical context summary
- Constitution check table (all PASS)
- Full project structure tree for CLI, Web, and Agents packages
- Structure decision rationale
- Phase 0 research decisions (8 decisions with rationale and alternatives)
- Phase 1 design artifact references (data-model, contracts, quickstart)
- Supporting files: data-model.md, contracts/registry-api.md, research.md, quickstart.md
