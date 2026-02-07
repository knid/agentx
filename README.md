<p align="center">
  <strong>agentx</strong>
</p>

<p align="center">
  The package manager for AI agents powered by Claude Code.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/agentx"><img src="https://img.shields.io/npm/v/agentx.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18-green.svg" alt="Node.js >= 18"></a>
</p>

---

**agentx** lets you discover, install, run, and publish AI agent packages from the terminal. Agents are reusable configurations for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that bundle system prompts, MCP server definitions, and secrets into shareable packages.

<!-- TODO: Replace with actual demo GIF -->
<!-- ![agentx demo](./docs/assets/demo.gif) -->

## Features

- **Run agents** - Execute agents locally with `agentx run <agent> "prompt"`
- **Install from registry** - One command install: `agentx install @scope/agent`
- **Search & discover** - Find agents via CLI or browse [agentx.dev](https://agentx.dev)
- **Publish agents** - Share your agents with `agentx publish`
- **Scaffold agents** - Create new agents with `agentx init`
- **Encrypted secrets** - AES-256-GCM encrypted secrets per agent
- **Pipe support** - `cat data.csv | agentx run data-analyst "summarize"`
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

# Pipe data in
cat report.csv | agentx run data-analyst "find anomalies"

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
  - read
  - write
mcp_servers:
  - name: filesystem
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "./"]
secrets:
  - name: API_KEY
    description: API key for the service
    required: true
```

## Official Starter Agents

| Agent | Description |
|-------|-------------|
| `@agentx/gmail-agent` | Email assistant with Gmail MCP |
| `@agentx/github-agent` | PR and issue assistant with GitHub MCP |
| `@agentx/data-analyst` | CSV/JSON data analysis with filesystem MCP |
| `@agentx/slack-agent` | Messaging assistant with Slack MCP |
| `@agentx/code-reviewer` | Code review with GitHub + filesystem MCP |

Install any starter agent:

```bash
agentx install @agentx/data-analyst
```

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
