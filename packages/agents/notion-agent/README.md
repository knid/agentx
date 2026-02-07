# @agentx/notion-agent

AI Notion assistant — search pages, manage databases, and organize your workspace from the terminal.

## Installation

```bash
agentx install @agentx/notion-agent
```

## Setup

### 1. Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Name it (e.g., "agentx") and select your workspace
4. Copy the **Internal Integration Secret**

### 2. Share Pages with the Integration

In Notion, open any page or database you want the agent to access, click "..." > "Connections" > Add your integration. The agent can only access pages explicitly shared with it.

### 3. Configure the Agent

```bash
agentx configure notion-agent
```

You'll be prompted to enter:
- `OPENAPI_MCP_HEADERS` — A JSON string in this format:

```json
{"Authorization": "Bearer ntn_YOUR_TOKEN", "Notion-Version": "2022-06-28"}
```

## Usage

```bash
# Search your workspace
agentx run notion-agent "Search for pages about project roadmap"

# Query a database
agentx run notion-agent "Show all tasks with status 'In Progress'"

# Create a new page
agentx run notion-agent "Create a meeting notes page for today's sprint review"

# Summarize content
agentx run notion-agent "Summarize my Product Requirements page"

# Interactive session
agentx run notion-agent -i
```

## Configuration

| Key | Description | Default |
|-----|-------------|---------|
| `default_database` | Default Notion database ID | `""` |
| `max_results` | Maximum results from searches | `20` |

## Permissions

- **Network**: Required for Notion API access

## License

MIT
