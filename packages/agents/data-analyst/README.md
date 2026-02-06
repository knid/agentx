# @agentx/data-analyst

AI data analysis assistant — analyze CSV, JSON, and other data files with natural language.

## Installation

```bash
agentx install @agentx/data-analyst
```

## Setup

This agent needs access to a directory containing your data files.

### Configure the Agent

```bash
agentx configure data-analyst
```

You'll be prompted to enter your `WORK_DIR` — the path to the directory where your data files are stored (e.g., `/Users/you/data`).

## Usage

```bash
# Analyze a CSV file
agentx run data-analyst "Analyze sales.csv and show me the top 10 products by revenue"

# Find trends
agentx run data-analyst "What are the trends in monthly_data.json?"

# Compare files
agentx run data-analyst "Compare q1.csv and q2.csv — what changed?"

# Detect anomalies
agentx run data-analyst "Find outliers in transactions.csv"

# Pipe data directly
cat report.csv | agentx run data-analyst "Summarize this data"

# Interactive mode
agentx run data-analyst -i
```

## Configuration

| Key | Description | Default |
|-----|-------------|---------|
| `max_rows_preview` | Max rows shown in data previews | `20` |
| `output_format` | Default output format (`text` or `json`) | `text` |

## Permissions

- **Filesystem**: Required to read data files in the configured directory

## License

MIT
