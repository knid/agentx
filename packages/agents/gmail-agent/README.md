# @agentx/gmail-agent

AI email assistant powered by Gmail — compose, search, summarize, and manage your inbox from the terminal.

## Installation

```bash
agentx install @agentx/gmail-agent
```

## Setup

This agent requires a Gmail OAuth token to access your inbox.

### 1. Get a Gmail Token

Follow the [Gmail MCP Server setup guide](https://github.com/anthropics/mcp-servers/tree/main/gmail) to obtain an OAuth token.

### 2. Configure the Agent

```bash
agentx configure gmail-agent
```

You'll be prompted to enter your `GMAIL_TOKEN`.

## Usage

```bash
# Check unread emails
agentx run gmail-agent "Show me my unread emails from today"

# Summarize recent emails
agentx run gmail-agent "Summarize the last 5 emails in my inbox"

# Compose an email
agentx run gmail-agent "Write an email to bob@example.com about the project deadline"

# Search emails
agentx run gmail-agent "Find emails about quarterly report from last month"

# Reply to an email
agentx run gmail-agent "Draft a reply to the latest email from Alice"

# Interactive mode
agentx run gmail-agent -i
```

## Configuration

| Key | Description | Default |
|-----|-------------|---------|
| `max_results` | Maximum emails in search results | `20` |
| `signature` | Signature appended to composed emails | (empty) |

## Permissions

- **Network**: Required for Gmail API access

## License

MIT
