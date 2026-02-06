# Data Model: MVP CLI Agent Marketplace

**Date**: 2026-02-06
**Spec**: specs/1-mvp-cli-agent-marketplace/spec.md

## Remote Entities (Neon PostgreSQL)

### users

Represents an authenticated agent creator/consumer.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Internal identifier |
| github_id | INTEGER | UNIQUE, NOT NULL | GitHub user ID |
| username | VARCHAR(100) | UNIQUE, NOT NULL | GitHub username |
| display_name | VARCHAR(255) | nullable | Display name |
| email | VARCHAR(255) | nullable | Email address |
| avatar_url | TEXT | nullable | GitHub avatar URL |
| bio | TEXT | nullable | User bio |
| website | TEXT | nullable | Personal website |
| created_at | TIMESTAMP | default NOW() | Account creation time |
| updated_at | TIMESTAMP | default NOW() | Last update time |

### agents

Represents a published agent package in the registry.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Internal identifier |
| scope | VARCHAR(100) | NOT NULL | Package scope (e.g., @agentx) |
| name | VARCHAR(100) | NOT NULL | Agent name (e.g., gmail-agent) |
| full_name | VARCHAR(200) | GENERATED (scope/name) | Full scoped name |
| author_id | UUID | FK -> users(id), CASCADE | Agent author |
| description | TEXT | nullable | Short description |
| readme | TEXT | nullable | Full README content |
| category | VARCHAR(50) | nullable | Category (productivity, devtools, etc.) |
| tags | TEXT[] | default '{}' | Searchable tags |
| license | VARCHAR(50) | nullable | License type |
| repository | TEXT | nullable | Source repository URL |
| homepage | TEXT | nullable | Homepage URL |
| download_count | INTEGER | default 0 | Total downloads across all versions |
| star_count | INTEGER | default 0 | Total stars |
| is_verified | BOOLEAN | default FALSE | Verified badge |
| is_featured | BOOLEAN | default FALSE | Featured on homepage |
| is_deprecated | BOOLEAN | default FALSE | Deprecated flag |
| latest_version | VARCHAR(50) | nullable | Latest published version |
| created_at | TIMESTAMP | default NOW() | First publish time |
| updated_at | TIMESTAMP | default NOW() | Last update time |

**Unique constraint**: (scope, name)

**Indexes**:
- idx_agents_category ON agents(category)
- idx_agents_author ON agents(author_id)
- idx_agents_downloads ON agents(download_count DESC)
- idx_agents_search ON agents USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')))

### agent_versions

Represents a specific published version of an agent.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Internal identifier |
| agent_id | UUID | FK -> agents(id), CASCADE | Parent agent |
| version | VARCHAR(50) | NOT NULL | Semver version string |
| tarball_url | TEXT | NOT NULL | R2 CDN URL for the tarball |
| tarball_sha256 | VARCHAR(64) | NOT NULL | SHA-256 hash for verification |
| tarball_size | INTEGER | NOT NULL | Tarball size in bytes |
| agent_yaml | JSONB | NOT NULL | Full agent.yaml as JSON |
| requires | JSONB | nullable | Requirements (claude_cli, node, os) |
| mcp_servers | JSONB | nullable | MCP server declarations |
| permissions | JSONB | nullable | Permission declarations |
| download_count | INTEGER | default 0 | Per-version downloads |
| published_at | TIMESTAMP | default NOW() | Publish timestamp |

**Unique constraint**: (agent_id, version)

### stars

Represents a user bookmarking/starring an agent.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| user_id | UUID | FK -> users(id), CASCADE | Starring user |
| agent_id | UUID | FK -> agents(id), CASCADE | Starred agent |
| created_at | TIMESTAMP | default NOW() | Star timestamp |

**Primary key**: (user_id, agent_id)

### downloads

Represents a download event for analytics.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Internal identifier |
| agent_id | UUID | FK -> agents(id), CASCADE | Downloaded agent |
| version | VARCHAR(50) | nullable | Downloaded version |
| ip_hash | VARCHAR(64) | nullable | Hashed IP for deduplication |
| created_at | TIMESTAMP | default NOW() | Download timestamp |

**Indexes**:
- idx_downloads_agent ON downloads(agent_id, created_at)

### telemetry

Represents anonymous usage telemetry events.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Internal identifier |
| agent_id | UUID | FK -> agents(id), nullable | Agent used |
| version | VARCHAR(50) | nullable | Agent version |
| success | BOOLEAN | nullable | Run succeeded or failed |
| duration_ms | INTEGER | nullable | Execution duration |
| error_type | VARCHAR(100) | nullable | Error category if failed |
| created_at | TIMESTAMP | default NOW() | Event timestamp |

## Local Entities (Filesystem)

### InstalledAgent (~/.agentx/agents/<name>/)

```
agent.yaml              # Agent manifest
system-prompt.md        # Agent system prompt
prompts/                # Optional sub-prompts
tools/                  # Optional custom tools
README.md               # Agent documentation
```

### SecretStore (~/.agentx/secrets/<agent>.enc.json)

```json
{
  "iv": "hex-encoded-iv",
  "tag": "hex-encoded-auth-tag",
  "data": "hex-encoded-encrypted-json"
}
```

Decrypted content is a flat key-value object:
```json
{
  "GMAIL_TOKEN": "ya29.xxx...",
  "GOOGLE_TOKEN": "ya29.yyy..."
}
```

### GlobalConfig (~/.agentx/config.yaml)

```yaml
registry: "https://registry.agentx.dev"
claude_path: "claude"
default_output: "text"
telemetry: true
auto_update: true
claude_defaults:
  max_turns: 10
```

### AuthToken (~/.agentx/auth.json)

```json
{
  "token": "agentx_xxxxx",
  "username": "sinan",
  "github_id": 12345,
  "created_at": "2026-02-06T00:00:00Z"
}
```

## Entity Relationships

```
users 1 ---< * agents          (author_id)
agents 1 ---< * agent_versions (agent_id)
users * ---< * agents          (stars: user_id, agent_id)
agents 1 ---< * downloads      (agent_id)
agents 1 ---< * telemetry      (agent_id)
```

## Validation Rules

### agent.yaml (Zod Schema)

- `name`: required, string, 1-100 chars, matches /^[a-z0-9-]+$/
- `version`: required, string, valid semver
- `description`: required, string, 1-500 chars
- `author`: required, string, starts with @
- `license`: optional, string (default: MIT)
- `tags`: optional, array of strings, max 10
- `category`: optional, enum of valid categories
- `requires`: optional, object with claude_cli, node, os fields
- `mcp_servers`: optional, record of server configs
- `secrets`: optional, array of secret declarations
- `permissions`: optional, object with boolean fields
- `config`: optional, array of config option definitions
- `examples`: optional, array of example prompts

### Categories (Valid Values)

productivity, devtools, communication, data, writing, research, automation, security, monitoring, other
