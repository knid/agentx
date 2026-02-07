# @agentx/puppeteer-agent

AI browser automation assistant — take screenshots, scrape pages, fill forms, and test UIs from the terminal.

## Installation

```bash
agentx install @agentx/puppeteer-agent
```

## Setup

No API keys or secrets are required. The agent uses a local headless Chromium browser via Puppeteer.

```bash
agentx configure puppeteer-agent
```

Chromium will be downloaded automatically on first use by the MCP server.

## Usage

```bash
# Take a screenshot
agentx run puppeteer-agent "Take a screenshot of https://example.com"

# Scrape data
agentx run puppeteer-agent "Scrape product names and prices from this page"

# Fill forms
agentx run puppeteer-agent "Fill out the contact form with test data"

# Check for broken links
agentx run puppeteer-agent "Check for broken links on https://example.com"

# Interactive browser session
agentx run puppeteer-agent -i
```

## Configuration

| Key | Description | Default |
|-----|-------------|---------|
| `viewport_width` | Browser viewport width (px) | `1280` |
| `viewport_height` | Browser viewport height (px) | `720` |

## Permissions

- **Network**: Required for loading web pages

## License

MIT
