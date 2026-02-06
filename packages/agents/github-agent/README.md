# @agentx/github-agent

AI GitHub assistant — manage PRs, issues, repos, and code reviews from the terminal.

## Installation

```bash
agentx install @agentx/github-agent
```

## Setup

This agent requires a GitHub personal access token.

### 1. Create a Token

Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens) and create a token with the following scopes:
- `repo` (Full control of private repositories)
- `read:org` (Read org membership)
- `read:user` (Read user profile data)

### 2. Configure the Agent

```bash
agentx configure github-agent
```

You'll be prompted to enter your `GITHUB_TOKEN`.

## Usage

```bash
# List open PRs
agentx run github-agent "Show me open PRs that need review"

# Create an issue
agentx run github-agent "Create an issue about the login page being slow"

# Summarize a PR
agentx run github-agent "Summarize PR #42"

# View recent commits
agentx run github-agent "What are the latest commits on main?"

# Interactive mode
agentx run github-agent -i
```

## Configuration

| Key | Description | Default |
|-----|-------------|---------|
| `default_repo` | Default repo in `owner/repo` format | (empty) |
| `max_results` | Max items in list operations | `20` |

## Permissions

- **Network**: Required for GitHub API access

## License

MIT
