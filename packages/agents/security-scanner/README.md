# @agentx/security-scanner

AI security scanner — find vulnerabilities, audit dependencies, and review code security from the terminal.

## Installation

```bash
agentx install @agentx/security-scanner
```

## Setup

### 1. Choose Your Project Directory

Decide which project root you want to scan.

### 2. Configure the Agent

```bash
agentx configure security-scanner
```

You'll be prompted to enter:
- `WORK_DIR` — The root directory of the project to scan (e.g., `/Users/you/myproject`)

## Usage

```bash
# General vulnerability scan
agentx run security-scanner "Scan this project for security vulnerabilities"

# Dependency audit
agentx run security-scanner "Check for dependencies with known vulnerabilities"

# Auth code review
agentx run security-scanner "Review the authentication code in src/auth/"

# Secret detection
agentx run security-scanner "Search for hardcoded secrets or API keys"

# Full security report
agentx run security-scanner "Generate a comprehensive security report"

# Interactive security audit
agentx run security-scanner -i
```

## Configuration

| Key | Description | Default |
|-----|-------------|---------|
| `scan_depth` | Thoroughness: `quick`, `standard`, or `deep` | `standard` |
| `report_format` | Output format: `markdown`, `json`, or `text` | `markdown` |

## What It Checks

- OWASP Top 10 vulnerability patterns
- Hardcoded secrets and API keys
- Outdated dependencies with known CVEs
- Authentication and authorization issues
- Input validation and injection risks
- Security misconfigurations

## Permissions

- **Filesystem**: Required to read project source files (read-only)

## License

MIT
