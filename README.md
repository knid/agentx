<p align="center">
  <strong>agentx</strong>
</p>

<p align="center">
  Install, chain, and orchestrate AI agents from the terminal.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/agentx"><img src="https://img.shields.io/npm/v/agentx.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18-green.svg" alt="Node.js >= 18"></a>
</p>

---

**agentx** lets you discover, install, chain, and orchestrate AI agents from the terminal. Pipe one agent's output into another with standard Unix pipes — research, analyze, write, and ship in a single command. Agents are reusable packages for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that bundle system prompts, MCP servers, and secrets.

<!-- TODO: Replace with actual demo GIF -->
<!-- ![agentx demo](./docs/assets/demo.gif) -->

## Features

- **Chain agents with pipes** - `agentx run agent-a --quiet | agentx run agent-b "use this"`
- **Run agents** - Execute agents locally with `agentx run <agent> "prompt"`
- **Install from registry** - One command install: `agentx install @scope/agent`
- **Schedule agents** - Cron-based scheduling: `agentx schedule start <agent>`
- **Search & discover** - Find agents via CLI or browse [agentx.dev](https://agentx.dev)
- **Publish agents** - Share your agents with `agentx publish`
- **Scaffold agents** - Create new agents with `agentx init`
- **Encrypted secrets** - AES-256-GCM encrypted secrets per agent
- **MCP integration** - Agents declare MCP servers for tool access

## Prerequisites

- **Node.js** >= 18
- **Claude CLI** installed and authenticated (`npm install -g @anthropic-ai/claude-code`)

## Install

```bash
npm install -g @knid/agentx
```

Verify your setup:

```bash
agentx doctor
```

## Quick Start

```bash
# Search for an agent
agentx search "data analysis"

# Install it
agentx install @agentx/data-analyst

# Run it
agentx run data-analyst "analyze trends in this data" --file sales.csv

# Chain agents — research, then write
agentx run web-researcher --quiet "2026 AI trends" \
  | agentx run writing-assistant "turn this into a blog post"

# Interactive mode
agentx run data-analyst -i
```

## Commands

| Command | Description |
|---------|-------------|
| `agentx run <agent> [prompt]` | Run an agent with a prompt |
| `agentx install <agent>` | Install an agent from the registry |
| `agentx uninstall <agent>` | Remove an installed agent |
| `agentx update [agent\|--all]` | Update agents to latest versions |
| `agentx list` | List installed agents |
| `agentx search <query>` | Search the agent registry |
| `agentx trending` | Show trending agents |
| `agentx info <agent>` | Show agent details |
| `agentx init` | Scaffold a new agent project |
| `agentx validate` | Validate an agent manifest |
| `agentx test` | Test an agent locally |
| `agentx publish` | Publish an agent to the registry |
| `agentx schedule start <agent>` | Start an agent's cron schedule |
| `agentx schedule stop <agent>` | Stop an agent's schedule |
| `agentx schedule list` | List all active schedules |
| `agentx schedule logs <agent>` | View execution logs for a scheduled agent |
| `agentx schedule resume` | Resume all schedules after restart |
| `agentx configure <agent>` | Configure secrets for an agent |
| `agentx login` | Authenticate with GitHub |
| `agentx logout` | Clear authentication |
| `agentx whoami` | Show current user |
| `agentx doctor` | Check system requirements |
| `agentx config` | Manage global configuration |

## Create Your Own Agent

```bash
# Scaffold a new agent
agentx init

# Edit the generated files
# - agent.yaml    (manifest: name, version, MCP servers, permissions)
# - system-prompt.md  (the system prompt for Claude)

# Validate it
agentx validate

# Test locally
agentx run . "test prompt"

# Publish to the registry
agentx login
agentx publish
```

### Agent Manifest (agent.yaml)

```yaml
name: my-agent
version: 1.0.0
description: A helpful agent
author: "@yourusername"
category: productivity
permissions:
  filesystem: true
  network: true
mcp_servers:
  filesystem:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "./"]
secrets:
  - name: API_KEY
    description: API key for the service
    required: true
schedule:
  - name: "Daily report"
    cron: "0 9 * * 1-5"
    prompt: "Generate the daily report"
```

## Agent Chaining

Agents write to stdout, so you can chain them with standard Unix pipes. The output of one agent becomes the input context for the next — build multi-step AI workflows in a single line:

```bash
# Research a topic, then create a Notion page from the results
agentx run web-researcher --quiet "2026 AI trends" \
  | agentx run notion-agent "create a new page summarizing this research"

# Scan for vulnerabilities, then create a Linear issue for each finding
agentx run security-scanner --quiet "audit src/auth/ for vulnerabilities" \
  | agentx run linear-agent "create a bug for each critical finding"

# Analyze data, then draft a report
agentx run data-analyst --quiet "summarize quarterly revenue" --file q4.csv \
  | agentx run writing-assistant "turn this into an executive summary"

# Review code, then send the review to Slack
agentx run code-reviewer --quiet "review the latest changes in src/api/" \
  | agentx run slack-agent "post this code review summary to #engineering"

# Three-step pipeline: research → rewrite → post
agentx run web-researcher --quiet "latest React best practices 2026" \
  | agentx run writing-assistant --quiet "rewrite as a concise team guide" \
  | agentx run slack-agent "post this to #frontend"
```

Use `--quiet` on intermediate agents to suppress headers/footers and pipe only the raw output. The last agent in the chain can run without `--quiet` to display formatted output.

## Scheduling

Agents can declare cron-based schedules in `agent.yaml`. A shared background daemon runs on your machine and executes agents at the specified times.

```bash
# Start an agent's schedule
agentx schedule start slack-agent

# View active schedules
agentx schedule list

# Check execution logs
agentx schedule logs slack-agent

# View all past runs
agentx schedule logs slack-agent --all

# Stop a schedule
agentx schedule stop slack-agent

# Resume all schedules after a restart
agentx schedule resume
```

The daemon automatically retries failed runs (up to 2 retries with backoff), rotates logs (keeps last 50 per agent), and cleans up when all schedules are stopped.

## Official Starter Agents

14 agents across all 10 categories — install any with `agentx install @agentx/<name>`:

| Agent | Category | Description |
|-------|----------|-------------|
| `@agentx/gmail-agent` | communication | Email assistant with Gmail MCP |
| `@agentx/slack-agent` | communication | Messaging assistant with Slack MCP |
| `@agentx/whatsapp-agent` | communication | WhatsApp messaging via local bridge |
| `@agentx/github-agent` | devtools | PR and issue management with GitHub MCP |
| `@agentx/code-reviewer` | devtools | Code review with GitHub + filesystem MCP |
| `@agentx/data-analyst` | data | CSV/JSON data analysis with filesystem MCP |
| `@agentx/postgres-agent` | data | PostgreSQL query and schema explorer |
| `@agentx/web-researcher` | research | Web search and synthesis with Brave + Fetch |
| `@agentx/notion-agent` | productivity | Notion workspace and database management |
| `@agentx/linear-agent` | productivity | Linear issue tracking and sprint management |
| `@agentx/sentry-agent` | monitoring | Error triage and stack trace analysis |
| `@agentx/puppeteer-agent` | automation | Browser automation, screenshots, and scraping |
| `@agentx/writing-assistant` | writing | Proofreading, drafting, and document editing |
| `@agentx/security-scanner` | security | Vulnerability scanning and dependency auditing |

## Configuration

Global config is stored at `~/.agentx/config.yaml`:

```bash
# View all config
agentx config list

# Get a value
agentx config get registry

# Set a value
agentx config set telemetry false
```

| Key | Default | Description |
|-----|---------|-------------|
| `registry` | `https://registry.agentx.dev` | Registry URL |
| `claude_path` | `claude` | Path to Claude CLI |
| `default_output` | `text` | Default output format (text/json) |
| `telemetry` | `true` | Enable anonymous telemetry |
| `auto_update` | `true` | Auto-check for updates |

## Project Structure

```
packages/
  cli/       # agentx CLI (npm package)
  web/       # agentx.dev website and registry API
  agents/    # Official starter agents
```

## Development

```bash
# Clone the repo
git clone https://github.com/agentx-dev/agentx.git
cd agentx

# Install dependencies
npm install

# Build the CLI
npm run build --workspace=packages/cli

# Run tests
npm test --workspace=packages/cli

# Type check
npx tsc --noEmit --project packages/cli/tsconfig.json

# Link for local development
cd packages/cli && npm link
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full development guidelines.

## License

[MIT](./LICENSE)
