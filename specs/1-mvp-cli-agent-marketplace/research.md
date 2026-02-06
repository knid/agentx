# Research: MVP CLI Agent Marketplace

**Date**: 2026-02-06
**Spec**: specs/1-mvp-cli-agent-marketplace/spec.md

## Research Topics

### 1. Claude CLI Interface and Flags

**Decision**: Use `claude -p "prompt" --system-prompt "..." --mcp-config /path/to/config.json --max-turns N --output-format text|json` for non-interactive mode, and `claude --system-prompt "..." --mcp-config /path/to/config.json` for interactive mode (stdio: inherit).

**Rationale**: The claude CLI supports non-interactive mode via `-p` flag, system prompts via `--system-prompt`, MCP configuration via `--mcp-config` (pointing to a JSON file), and output format control. Interactive mode is entered by omitting `-p` and inheriting stdio.

**Alternatives considered**:
- Claude API directly (rejected: requires API key, violates Principle II and IV)
- Custom AI integration (rejected: violates Principle IV, unnecessary complexity)

### 2. MCP Config File Format

**Decision**: Generate a temporary JSON file following the MCP config standard:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-xxx"],
      "env": {
        "API_KEY": "resolved-value"
      }
    }
  }
}
```

**Rationale**: This is the standard format accepted by Claude CLI's `--mcp-config` flag. The file is written to a temp directory with a UUID-based filename to avoid conflicts.

**Alternatives considered**:
- Inline MCP config via flags (rejected: not supported by claude CLI)
- Persistent MCP config (rejected: would leak secrets to disk; temp file with cleanup is safer)

### 3. Tarball Creation and Extraction

**Decision**: Use the `tar` npm package (specifically `tar.create` and `tar.extract`) for portable tar.gz operations.

**Rationale**: The `tar` package is the same one used by npm itself, is well-tested, and provides a pure JavaScript implementation that works on all platforms without requiring system `tar`.

**Alternatives considered**:
- Node.js child_process with system tar (rejected: not available on all platforms, especially Windows)
- archiver/decompress packages (rejected: tar is more standard for package distribution)

### 4. Machine ID for Key Derivation

**Decision**: Use the `node-machine-id` package or read from `/etc/machine-id` (Linux) / `IOPlatformUUID` (macOS) for key derivation input.

**Rationale**: Machine ID provides a stable, per-machine identifier that ties encrypted secrets to the specific machine. This prevents copying encrypted secret files between machines (a security feature).

**Alternatives considered**:
- Hostname (rejected: changes frequently, not unique)
- Random key stored in plaintext (rejected: no better than storing secrets in plaintext)
- OS keychain (rejected: adds platform-specific complexity, violates Principle VII)

### 5. GitHub OAuth for CLI

**Decision**: Implement a lightweight local HTTP server (on a random port) to receive the OAuth callback, similar to how `gh auth login` works.

**Flow**:
1. CLI starts a temporary HTTP server on localhost (random port)
2. CLI opens browser to `https://github.com/login/oauth/authorize?client_id=XXX&redirect_uri=http://localhost:PORT/callback&scope=read:user,user:email`
3. User authenticates on GitHub
4. GitHub redirects to localhost with authorization code
5. CLI exchanges code for token via agentx.dev API (server-side, keeping client_secret secure)
6. Token saved to `~/.agentx/auth.json`
7. Local server shuts down

**Rationale**: This is the standard pattern for CLI OAuth. The client_secret stays on the server side (agentx.dev), and the local callback server is ephemeral.

**Alternatives considered**:
- Device flow (simpler but GitHub doesn't support it for all OAuth apps)
- Manual token paste (rejected: poor UX)

### 6. PostgreSQL Full-Text Search

**Decision**: Use PostgreSQL tsvector/tsquery for agent search, with a GIN index on the concatenation of agent name and description.

**Rationale**: PostgreSQL FTS is included with Neon, requires no additional service, and is sufficient for the expected scale (thousands of agents, not millions). The GIN index provides fast lookup.

**Alternatives considered**:
- Algolia (rejected: paid service, violates Principle II)
- Meilisearch (rejected: additional service to host)
- pg_trgm (considered as supplement for typo tolerance, but FTS is sufficient for MVP)

### 7. Agent Config Variable Injection

**Decision**: Use double-curly-brace syntax `{{config.key}}` in system-prompt.md, processed by a simple regex-based template engine before passing to claude.

**Rationale**: Handlebars/Mustache-style syntax is widely recognized. A simple `replace` is sufficient; no need for a full template engine in MVP.

**Alternatives considered**:
- Handlebars (rejected: overkill for simple variable substitution)
- Environment variables (rejected: less explicit, harder to document in system-prompt.md)
- EJS (rejected: adds unnecessary dependency and security risk from template injection)

### 8. Cloudflare R2 Integration

**Decision**: Use the AWS S3-compatible API via `@aws-sdk/client-s3` to interact with Cloudflare R2.

**Rationale**: R2 is S3-compatible, so the standard AWS SDK works without modification. This provides a well-documented, type-safe client. R2's free tier includes 10GB storage and 1M Class B requests per month.

**Alternatives considered**:
- Cloudflare Workers API (rejected: less portable, harder to test locally)
- Vercel Blob Storage (considered, but R2 has more generous free tier and CDN built-in)
