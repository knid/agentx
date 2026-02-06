# agentx

The package manager for AI agents powered by Claude Code.

## Overview

agentx is a CLI tool for discovering, installing, and managing AI agent packages.
It provides a registry-backed marketplace where developers can publish reusable
agent configurations and users can install them with a single command.

## Prerequisites

- Node.js >= 18
- Claude CLI

## Install

```bash
npm install -g agentx
```

## Usage

```bash
# Search for agents in the registry
agentx search <query>

# Install an agent package
agentx install <package-name>

# Run an installed agent
agentx run <agent-name>

# Initialize a new agent project
agentx init

# Publish an agent to the registry
agentx publish
```

## Development

This project uses npm workspaces. All packages live under `packages/`.

```bash
# Build all packages
npm run build

# Run tests across all packages
npm run test

# Lint all packages
npm run lint
```

## License

MIT
