# Registry API Contract: agentx.dev

**Base URL**: `https://registry.agentx.dev/api/v1`
**Authentication**: Bearer token in `Authorization` header (for write operations)
**Content-Type**: `application/json` (unless otherwise noted)

## Authentication

### POST /auth/github

Initiate GitHub OAuth flow.

**Request**:
```json
{
  "redirect_uri": "http://localhost:9876/callback"
}
```

**Response** (200):
```json
{
  "auth_url": "https://github.com/login/oauth/authorize?client_id=...&redirect_uri=..."
}
```

### GET /auth/callback

GitHub OAuth callback handler. Exchanges code for access token, creates/updates user, returns agentx token.

**Query Parameters**:
- `code` (string, required): GitHub OAuth authorization code
- `state` (string, required): CSRF state token

**Response** (200):
```json
{
  "token": "agentx_xxxxxxxxxxxxxxxx",
  "user": {
    "username": "sinan",
    "display_name": "Sinan",
    "avatar_url": "https://avatars.githubusercontent.com/...",
    "github_id": 12345
  }
}
```

---

## Agent Discovery

### GET /agents

List and search agents with pagination.

**Query Parameters**:
- `q` (string, optional): Search query
- `category` (string, optional): Filter by category
- `sort` (string, optional): Sort order - `downloads` (default), `stars`, `newest`
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Results per page (default: 20, max: 100)

**Response** (200):
```json
{
  "agents": [
    {
      "scope": "@agentx",
      "name": "gmail-agent",
      "full_name": "@agentx/gmail-agent",
      "description": "AI email assistant",
      "category": "productivity",
      "tags": ["email", "gmail"],
      "latest_version": "1.2.0",
      "download_count": 12543,
      "star_count": 342,
      "is_verified": true,
      "author": {
        "username": "agentx",
        "avatar_url": "..."
      },
      "updated_at": "2026-02-01T00:00:00Z"
    }
  ],
  "total": 47,
  "page": 1,
  "limit": 20
}
```

### GET /search

Full-text search across agent names and descriptions.

**Query Parameters**:
- `q` (string, required): Search query
- `limit` (integer, optional): Max results (default: 20)

**Response** (200): Same format as GET /agents.

### GET /trending

Get trending agents for a time period.

**Query Parameters**:
- `period` (string, optional): `day`, `week` (default), `month`
- `limit` (integer, optional): Max results (default: 20)

**Response** (200): Same format as GET /agents, sorted by download count within the period.

### GET /categories

List all valid categories.

**Response** (200):
```json
{
  "categories": [
    { "slug": "productivity", "name": "Productivity", "count": 15 },
    { "slug": "devtools", "name": "Developer Tools", "count": 12 },
    { "slug": "communication", "name": "Communication", "count": 8 }
  ]
}
```

---

## Agent Details

### GET /agents/:scope/:name

Get detailed agent information.

**Path Parameters**:
- `scope` (string): Agent scope (e.g., `@agentx`)
- `name` (string): Agent name (e.g., `gmail-agent`)

**Response** (200):
```json
{
  "scope": "@agentx",
  "name": "gmail-agent",
  "full_name": "@agentx/gmail-agent",
  "description": "AI email assistant",
  "readme": "# Gmail Agent\n\n...",
  "category": "productivity",
  "tags": ["email", "gmail", "productivity"],
  "license": "MIT",
  "repository": "https://github.com/agentx-dev/gmail-agent",
  "latest_version": "1.2.0",
  "download_count": 12543,
  "star_count": 342,
  "is_verified": true,
  "is_featured": false,
  "author": {
    "username": "agentx",
    "display_name": "agentx",
    "avatar_url": "..."
  },
  "permissions": {
    "filesystem": false,
    "network": true,
    "execute_commands": false
  },
  "mcp_servers": ["gmail", "calendar"],
  "examples": [
    { "prompt": "summarize unread emails from today" },
    { "prompt": "draft a reply to John about the deadline" }
  ],
  "created_at": "2026-01-15T00:00:00Z",
  "updated_at": "2026-02-01T00:00:00Z"
}
```

**Response** (404):
```json
{ "error": "Agent not found" }
```

### GET /agents/:scope/:name/versions

Get version history for an agent.

**Response** (200):
```json
{
  "versions": [
    {
      "version": "1.2.0",
      "tarball_size": 4096,
      "download_count": 5000,
      "published_at": "2026-02-01T00:00:00Z"
    },
    {
      "version": "1.1.0",
      "tarball_size": 3800,
      "download_count": 7543,
      "published_at": "2026-01-20T00:00:00Z"
    }
  ]
}
```

### GET /agents/:scope/:name/download/:version

Download the agent tarball.

**Path Parameters**:
- `version` (string): Semver version to download

**Response** (200):
```json
{
  "tarball_url": "https://r2.agentx.dev/agents/@agentx/gmail-agent/1.2.0.tar.gz",
  "sha256": "abc123def456...",
  "size": 4096
}
```

The CLI then fetches the tarball directly from the R2 CDN URL.

**Response** (404):
```json
{ "error": "Version not found" }
```

---

## Agent Publishing

### PUT /agents/:scope/:name

Publish or update an agent. Requires authentication.

**Headers**:
- `Authorization: Bearer agentx_xxxxx`
- `Content-Type: multipart/form-data`

**Form Fields**:
- `tarball` (file, required): The .tar.gz agent package
- `agent_yaml` (string, required): JSON-serialized agent.yaml content
- `readme` (string, required): README.md content

**Response** (200):
```json
{
  "success": true,
  "version": "1.2.0",
  "full_name": "@agentx/gmail-agent",
  "url": "https://agentx.dev/agents/@agentx/gmail-agent"
}
```

**Response** (400):
```json
{
  "error": "Validation failed",
  "details": [
    "agent.yaml: missing required field 'description'",
    "agent.yaml: version '1.2' is not valid semver"
  ]
}
```

**Response** (403):
```json
{ "error": "You can only publish under @your-username scope" }
```

**Response** (409):
```json
{ "error": "Version 1.2.0 already exists. Bump the version number." }
```

### DELETE /agents/:scope/:name/:version

Unpublish a specific version. Requires authentication.

**Response** (200):
```json
{ "success": true, "message": "Version 1.2.0 unpublished" }
```

---

## User Profiles

### GET /users/:username

Get a user's public profile.

**Response** (200):
```json
{
  "username": "sinan",
  "display_name": "Sinan",
  "avatar_url": "...",
  "bio": "Building agentx",
  "website": "https://sinan.dev",
  "agent_count": 5,
  "total_downloads": 50000,
  "created_at": "2026-01-01T00:00:00Z"
}
```

### GET /users/:username/agents

Get agents published by a user.

**Response** (200): Same format as GET /agents.

---

## Telemetry

### POST /telemetry

Submit anonymous usage telemetry. No authentication required.

**Request**:
```json
{
  "agent_name": "gmail-agent",
  "agent_version": "1.2.0",
  "success": true,
  "duration_ms": 3500,
  "os": "darwin",
  "cli_version": "0.1.0"
}
```

**Response** (200):
```json
{ "ok": true }
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Human-readable error message",
  "details": ["Optional array of specific issues"]
}
```

## Rate Limiting

All endpoints are rate-limited via Upstash Redis:
- Unauthenticated: 60 requests per minute per IP
- Authenticated: 120 requests per minute per user
- Publish: 10 requests per hour per user

Rate limit headers included in all responses:
- `X-RateLimit-Limit`: Max requests in window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Seconds until window reset
