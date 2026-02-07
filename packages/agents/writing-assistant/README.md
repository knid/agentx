# @agentx/writing-assistant

AI writing assistant — proofread, rewrite, draft, and improve documents from the terminal.

## Installation

```bash
agentx install @agentx/writing-assistant
```

## Setup

### 1. Choose Your Documents Directory

Decide which directory contains the documents you want to work with.

### 2. Configure the Agent

```bash
agentx configure writing-assistant
```

You'll be prompted to enter:
- `WORK_DIR` — The path to your documents directory (e.g., `/Users/you/documents`)

## Usage

```bash
# Proofread a document
agentx run writing-assistant "Proofread report.md and fix any errors"

# Rewrite for clarity
agentx run writing-assistant "Rewrite the intro of proposal.md to be more engaging"

# Draft new content
agentx run writing-assistant "Draft a blog post about remote work best practices"

# Summarize a document
agentx run writing-assistant "Summarize meeting-notes.md into action items"

# Interactive editing session
agentx run writing-assistant -i
```

## Configuration

| Key | Description | Default |
|-----|-------------|---------|
| `tone` | Default tone: `professional`, `casual`, `academic`, `creative` | `professional` |
| `language` | Primary language for writing | `English` |

## Permissions

- **Filesystem**: Required to read and write documents

## License

MIT
