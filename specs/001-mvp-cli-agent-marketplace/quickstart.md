# Quickstart: agentx

## Prerequisites

- Node.js >= 18
- Claude CLI installed (`npm install -g @anthropic-ai/claude-code`)
- Claude Pro or Max subscription (authenticated via `claude`)

## Install agentx

```bash
npm install -g @knid/agentx
```

## Verify Setup

```bash
agentx doctor
```

Expected output:
```
  claude CLI found (v1.x.x)
  Claude authentication detected
  Node.js v20+
  agentx ready!
```

## Find an Agent

```bash
agentx search "data analysis"
```

## Install an Agent

```bash
agentx install @agentx/data-analyst
```

## Run an Agent

```bash
# One-shot mode
agentx run data-analyst "analyze the top trends in this data" --file sales.csv

# Pipe mode
cat report.csv | agentx run data-analyst "find anomalies"

# Interactive mode
agentx run data-analyst -i

# JSON output
agentx run data-analyst "summarize this data" --file data.json --json
```

## Create Your Own Agent

```bash
agentx init
# Follow the interactive prompts

# Test it locally
cd my-agent
agentx test
agentx run . "test prompt"

# Publish it
agentx login
agentx publish
```

## Manage Agents

```bash
# List installed agents
agentx list

# Update agents
agentx update --all

# Configure secrets for an agent
agentx configure gmail-agent

# Get agent info
agentx info @agentx/gmail-agent

# Uninstall
agentx uninstall gmail-agent
```

## Verification Steps

1. `npm install -g @knid/agentx` completes without errors
2. `agentx doctor` reports all checks passing
3. `agentx search email` returns results from the registry
4. `agentx install @agentx/data-analyst` downloads and extracts the agent
5. `agentx list` shows the installed agent
6. `agentx run data-analyst "hello"` spawns claude and returns output
7. `agentx uninstall data-analyst` removes the agent cleanly
