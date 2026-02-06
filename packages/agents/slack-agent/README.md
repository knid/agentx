# @agentx/slack-agent

AI Slack assistant — send messages, search conversations, and manage channels from the terminal.

## Installation

```bash
agentx install @agentx/slack-agent
```

## Setup

This agent requires a Slack Bot User OAuth token.

### 1. Create a Slack App

1. Go to [Slack API: Your Apps](https://api.slack.com/apps) and create a new app
2. Under **OAuth & Permissions**, add the following Bot Token Scopes:
   - `channels:read` — View basic channel information
   - `channels:history` — View messages in public channels
   - `chat:write` — Send messages as the bot
   - `search:read` — Search messages
   - `users:read` — View basic user information
3. Install the app to your workspace
4. Copy the **Bot User OAuth Token** (`xoxb-...`)

### 2. Configure the Agent

```bash
agentx configure slack-agent
```

You'll be prompted to enter your `SLACK_TOKEN`.

## Usage

```bash
# Send a message
agentx run slack-agent "Send a message to #engineering saying the deploy is done"

# Read recent messages
agentx run slack-agent "What were the latest messages in #general?"

# Search conversations
agentx run slack-agent "Search for discussions about the API redesign"

# Channel summary
agentx run slack-agent "Summarize what happened in #product today"

# Interactive mode
agentx run slack-agent -i
```

## Configuration

| Key | Description | Default |
|-----|-------------|---------|
| `default_channel` | Default channel for messages (e.g., `#general`) | (empty) |
| `max_results` | Max messages in search results | `20` |

## Permissions

- **Network**: Required for Slack API access

## License

MIT
