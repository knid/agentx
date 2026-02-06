# @agentx/code-reviewer

AI code review assistant — review PRs, analyze diffs, and provide actionable feedback.

## Installation

```bash
agentx install @agentx/code-reviewer
```

## Setup

This agent requires both a GitHub token and a local repository path.

### 1. Create a GitHub Token

Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens) and create a token with the `repo` scope.

### 2. Configure the Agent

```bash
agentx configure code-reviewer
```

You'll be prompted to enter:
- `GITHUB_TOKEN` — Your GitHub personal access token
- `WORK_DIR` — The local path to the repository you want to review

## Usage

```bash
# Review a pull request
agentx run code-reviewer "Review PR #42 for bugs and security issues"

# Review a specific file
agentx run code-reviewer "What could be improved in src/auth/login.ts?"

# Security audit a directory
agentx run code-reviewer "Check src/api/ for security vulnerabilities"

# Compare branches
agentx run code-reviewer "Analyze the diff between main and feature-branch"

# Interactive review session
agentx run code-reviewer -i
```

## Configuration

| Key | Description | Default |
|-----|-------------|---------|
| `review_focus` | Focus areas: `correctness`, `security`, `performance`, `readability`, `all` | `all` |
| `severity_threshold` | Minimum severity: `info`, `warning`, `error` | `info` |

## Permissions

- **Filesystem**: Required to read local source code
- **Network**: Required for GitHub API access

## License

MIT
