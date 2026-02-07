# @agentx/web-researcher

AI research assistant — search the web, fetch pages, and synthesize findings with source citations.

## Installation

```bash
agentx install @agentx/web-researcher
```

## Setup

### 1. Get a Brave Search API Key

Go to [Brave Search API](https://brave.com/search/api/) and create a free account to get an API key. The free tier includes 2,000 queries/month.

### 2. Configure the Agent

```bash
agentx configure web-researcher
```

You'll be prompted to enter:
- `BRAVE_API_KEY` — Your Brave Search API key

## Usage

```bash
# Research a topic
agentx run web-researcher "Research the latest trends in AI agent frameworks"

# Compare technologies
agentx run web-researcher "Compare Next.js vs Remix for a new SaaS project"

# Summarize a URL
agentx run web-researcher "Summarize this article: https://example.com/article"

# Find best practices
agentx run web-researcher "Find best practices for PostgreSQL performance tuning"

# Interactive research session
agentx run web-researcher -i
```

## Configuration

| Key | Description | Default |
|-----|-------------|---------|
| `search_depth` | Number of search results per query | `10` |
| `summary_length` | Detail level: `brief`, `standard`, or `detailed` | `detailed` |

## Permissions

- **Network**: Required for web search and page fetching

## License

MIT
