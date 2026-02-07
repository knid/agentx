# @agentx/postgres-agent

AI PostgreSQL assistant — inspect schemas, run analytical queries, and explore databases from the terminal.

## Installation

```bash
agentx install @agentx/postgres-agent
```

## Setup

### 1. Get Your Connection URL

You'll need a PostgreSQL connection URL in the format:
```
postgresql://user:password@host:5432/database
```

### 2. Configure the Agent

```bash
agentx configure postgres-agent
```

You'll be prompted to enter:
- `POSTGRES_URL` — Your PostgreSQL connection URL

## Usage

```bash
# Explore database schema
agentx run postgres-agent "Show me all tables and their row counts"

# Run analytical queries
agentx run postgres-agent "What are the top 10 customers by order value?"

# Explore relationships
agentx run postgres-agent "Describe relationships between users and orders"

# Performance analysis
agentx run postgres-agent "Explain the index usage for the products table"

# Interactive SQL session
agentx run postgres-agent -i
```

## Configuration

| Key | Description | Default |
|-----|-------------|---------|
| `max_rows` | Maximum rows to display in results | `50` |
| `read_only` | Only allow read-only queries | `true` |

## Permissions

- **Network**: Required for database connections

## License

MIT
