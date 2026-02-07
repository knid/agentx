# @agentx/linear-agent

AI Linear assistant — manage issues, track cycles, and monitor sprint progress from the terminal.

## Installation

```bash
agentx install @agentx/linear-agent
```

## Setup

### 1. Create a Linear API Key

Go to [Linear Settings > API](https://linear.app/settings/api) and create a Personal API key.

### 2. Configure the Agent

```bash
agentx configure linear-agent
```

You'll be prompted to enter:
- `LINEAR_API_KEY` — Your Linear personal API key

## Usage

```bash
# View your assigned issues
agentx run linear-agent "Show me my assigned issues sorted by priority"

# Create a bug report
agentx run linear-agent "Create a bug: Login page crashes on Safari"

# Check sprint status
agentx run linear-agent "What's the status of the current sprint?"

# Update an issue
agentx run linear-agent "Move issue ENG-142 to 'In Review'"

# Interactive session
agentx run linear-agent -i
```

## Scheduled Reports

This agent comes with a pre-configured schedule:
- **Sprint status** — Mondays at 9:00 AM, reports current cycle progress

## Configuration

| Key | Description | Default |
|-----|-------------|---------|
| `default_team` | Default Linear team key (e.g., `ENG`) | `""` |
| `max_results` | Maximum issues to display | `20` |

## Permissions

- **Network**: Required for Linear API access

## License

MIT
