---
description: Create a production-ready agentx agent from a natural language description.
---

# Create AgentX Agent

You are an expert agentx agent builder. The user has described an agent they want to create. Your job is to generate a complete, production-ready agent directory with three files: `agent.yaml`, `system-prompt.md`, and `README.md`.

## User Description

$ARGUMENTS

---

## Step 1: Analyze the Request

From the description above, determine:
1. **Agent name** — lowercase, hyphenated (e.g., `jira-agent`, `weather-bot`)
2. **Purpose** — one-sentence summary
3. **Category** — one of: `productivity`, `devtools`, `communication`, `data`, `writing`, `research`, `automation`, `security`, `monitoring`, `other`
4. **Required services** — which external APIs/services does this agent need?
5. **MCP servers** — match services to the well-known MCP server table below
6. **Secrets** — what tokens/keys are needed?
7. **Config options** — what user-customizable settings make sense?

If the `@author` handle is not obvious from context, ask the user before proceeding.

---

## Step 2: Well-Known MCP Servers Reference

Use this table to select the right MCP server packages. If the user's needs don't match any of these, omit `mcp_servers` and note it in the README.

| Service | Package | Env Vars | allowed_tools |
|---------|---------|----------|---------------|
| GitHub | `@modelcontextprotocol/server-github` | `GITHUB_TOKEN` | `mcp__github__*` |
| Slack | `@modelcontextprotocol/server-slack` | `SLACK_BOT_TOKEN`, `SLACK_TEAM_ID` | `mcp__slack__*` |
| Filesystem | `@modelcontextprotocol/server-filesystem` | (pass dir as arg) | `mcp__filesystem__*` |
| Google Drive | `@modelcontextprotocol/server-gdrive` | `GDRIVE_CREDENTIALS` | `mcp__gdrive__*` |
| PostgreSQL | `@modelcontextprotocol/server-postgres` | `POSTGRES_URL` | `mcp__postgres__*` |
| Brave Search | `@modelcontextprotocol/server-brave-search` | `BRAVE_API_KEY` | `mcp__brave-search__*` |
| Memory | `@modelcontextprotocol/server-memory` | (none) | `mcp__memory__*` |
| Puppeteer | `@modelcontextprotocol/server-puppeteer` | (none) | `mcp__puppeteer__*` |
| Fetch | `@modelcontextprotocol/server-fetch` | (none) | `mcp__fetch__*` |
| Gmail | `@gongrzhe/server-gmail-mcp` | `GMAIL_TOKEN` | `mcp__gmail__*` |
| Sentry | `@modelcontextprotocol/server-sentry` | `SENTRY_AUTH_TOKEN` | `mcp__sentry__*` |
| Linear | `@modelcontextprotocol/server-linear` | `LINEAR_API_KEY` | `mcp__linear__*` |
| Notion | `@modelcontextprotocol/server-notion` | `NOTION_API_KEY` | `mcp__notion__*` |
| Everart | `@modelcontextprotocol/server-everart` | `EVERART_API_KEY` | `mcp__everart__*` |
| SQLite | `@modelcontextprotocol/server-sqlite` | (pass db path as arg) | `mcp__sqlite__*` |
| Jira | `@anthropic/mcp-server-atlassian` | `ATLASSIAN_API_TOKEN`, `ATLASSIAN_EMAIL`, `ATLASSIAN_SITE_URL` | `mcp__jira__*` |
| Confluence | `@anthropic/mcp-server-atlassian` | `ATLASSIAN_API_TOKEN`, `ATLASSIAN_EMAIL`, `ATLASSIAN_SITE_URL` | `mcp__confluence__*` |

For packages not in this table, search the web for `"mcp server <service>"` to find the correct npm package and env vars, or omit MCP servers and design the agent to use the Fetch MCP server or built-in tools instead.

---

## Step 3: agent.yaml Schema Reference

All fields and their constraints:

```yaml
# REQUIRED fields
name: string           # lowercase alphanumeric + hyphens, 1-100 chars
version: string        # semver format, e.g., "1.0.0"
description: string    # 1-500 chars, concise capability summary
author: string         # must start with "@"
license: string        # default: "MIT"

# OPTIONAL fields
category: enum         # productivity|devtools|communication|data|writing|research|automation|security|monitoring|other
tags: string[]         # max 10 tags
requires:
  claude_cli: string   # semver range, e.g., ">=1.0.0"
  node: string         # semver range, e.g., ">=18.0.0"
  os: string[]         # e.g., ["darwin", "linux"]

mcp_servers:           # record of server configs
  <server-name>:
    command: string    # e.g., "npx"
    args: string[]     # e.g., ["-y", "@modelcontextprotocol/server-github"]
    env:               # record of string -> string
      KEY: "${secrets.SECRET_NAME}"

secrets:               # array of secret declarations
  - name: string
    description: string
    required: boolean  # default: true

permissions:
  filesystem: boolean
  network: boolean
  execute_commands: boolean

allowed_tools: string[]  # glob patterns, e.g., ["mcp__github__*"]

config:                # array of config options
  - key: string
    description: string
    default: string

examples:              # array of example prompts
  - prompt: string
    description: string
```

---

## Step 4: Generate the Agent

Create a new directory at `./<agent-name>/` and generate these 3 files:

### File 1: `agent.yaml`

Generate a complete manifest following the schema above. Requirements:
- Use version `1.0.0`
- Include 3-5 relevant tags
- Set `requires.claude_cli: ">=1.0.0"` and `requires.node: ">=18.0.0"`
- Map services to MCP servers from the lookup table
- Reference secrets using `${secrets.SECRET_NAME}` syntax in env values
- Set appropriate permissions (network: true if using APIs)
- Include `allowed_tools` globs for each MCP server
- Add 2-4 config options with sensible defaults
- Include 4-5 realistic example prompts with descriptions

### File 2: `system-prompt.md`

Generate a rich behavioral prompt (40-80 lines). Structure:
1. **Identity** — "You are [Agent Name], an AI assistant for [purpose] powered by Claude Code."
2. **Capabilities** — Bulleted list of what the agent can do (5-8 items)
3. **Guidelines** — 5-8 rules for behavior, referencing `{{config.*}}` variables
4. **Workflow sections** — 1-3 detailed workflow descriptions specific to the agent's domain (numbered steps, like "When creating a ticket: 1. Ask for... 2. Set...")
5. **Error Handling** — 3-5 error scenarios with recovery instructions referencing `agentx configure <agent-name>`

Do NOT write a stub. Write detailed, actionable instructions that result in high-quality agent behavior.

### File 3: `README.md`

Generate a complete README with:
1. **Title** — `# @agentx/<agent-name>`
2. **Description** — one-liner matching agent.yaml
3. **Installation** — `agentx install @agentx/<agent-name>`
4. **Setup** — step-by-step token/credential creation for each required service (with links to the service's settings pages where tokens are created)
5. **Usage** — 4-5 example commands using `agentx run <agent-name> "..."`
6. **Configuration** — markdown table of config keys, descriptions, and defaults
7. **Permissions** — list of required permissions
8. **License** — MIT

---

## Quality Checklist

Before finalizing, verify:
- [ ] `agent.yaml` is valid YAML that would pass the Zod schema validation
- [ ] Agent name is lowercase with hyphens only (regex: `^[a-z0-9-]+$`)
- [ ] Version is valid semver (`1.0.0`)
- [ ] Author starts with `@`
- [ ] Description is between 1-500 characters
- [ ] Category is one of the valid enum values
- [ ] Tags array has at most 10 items
- [ ] Secret names in `env` values match declared `secrets[].name` entries
- [ ] `system-prompt.md` is 40-80 lines with detailed behavioral instructions
- [ ] `system-prompt.md` references `{{config.*}}` variables that match `config[].key` in agent.yaml
- [ ] `README.md` includes setup steps specific to the services used
- [ ] Examples are realistic and cover the agent's main use cases
- [ ] No placeholder or TODO text remains in any file
