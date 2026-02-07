# @agentx/sentry-agent

AI error monitoring assistant — triage Sentry issues, analyze stack traces, and track error trends.

## Installation

```bash
agentx install @agentx/sentry-agent
```

## Setup

### 1. Create a Sentry Auth Token

Go to [Sentry Settings > Auth Tokens](https://sentry.io/settings/auth-tokens/) and create a token with the following scopes:
- `project:read`
- `org:read`
- `event:read`

### 2. Configure the Agent

```bash
agentx configure sentry-agent
```

You'll be prompted to enter:
- `SENTRY_AUTH_TOKEN` — Your Sentry authentication token

## Usage

```bash
# View recent errors
agentx run sentry-agent "Show me the top unresolved errors in the last 24 hours"

# Investigate an issue
agentx run sentry-agent "Investigate the most frequent error and suggest a fix"

# Detect spikes
agentx run sentry-agent "Are there any error spikes compared to yesterday?"

# Analyze a stack trace
agentx run sentry-agent "Show the stack trace for issue PROJ-1234"

# Interactive monitoring session
agentx run sentry-agent -i
```

## Scheduled Monitoring

This agent comes with a pre-configured schedule:
- **Daily error digest** — Weekdays at 9:00 AM, summarizes unresolved errors from the last 24 hours

## Configuration

| Key | Description | Default |
|-----|-------------|---------|
| `default_project` | Default Sentry project slug | `""` |
| `severity_filter` | Minimum severity: `info`, `warning`, `error`, `fatal` | `error` |

## Permissions

- **Network**: Required for Sentry API access

## License

MIT
