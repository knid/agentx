# @agentx/whatsapp-agent

AI WhatsApp assistant — send messages, read conversations, and search chat history from the terminal.

## Installation

```bash
agentx install @agentx/whatsapp-agent
```

## Setup

This agent uses the [whatsapp-mcp-server](https://github.com/lharries/whatsapp-mcp-server) which requires a few components.

### Prerequisites

- **uv** (Python package manager): Install with `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **Go 1.22+**: Required for the WhatsApp bridge. Install from [go.dev](https://go.dev/dl/)

### 1. Install and Build the Bridge

```bash
# Clone the WhatsApp bridge
git clone https://github.com/lharries/whatsapp-mcp-server.git
cd whatsapp-mcp-server/whatsapp-bridge

# Build the Go bridge
go build -o whatsapp-bridge
```

### 2. Add the Bridge to Your PATH

Copy or symlink the built binary somewhere on your `$PATH`:

```bash
cp whatsapp-bridge /usr/local/bin/
```

Alternatively, set the `WHATSAPP_BRIDGE_PATH` environment variable to the binary's location.

### 3. Scan the QR Code (First Time)

Run the bridge once manually to complete initial authentication:

```bash
whatsapp-bridge
```

A QR code will appear in your terminal. Scan it with WhatsApp on your phone (Settings > Linked Devices > Link a Device). After linking, the session is persisted — you won't need to scan again.

### 4. Run the Agent

The agent automatically starts the WhatsApp bridge in the background via `pre_run`, so you don't need to start it manually. No additional secrets are needed — authentication is handled by the QR code scan.

```bash
agentx configure whatsapp-agent
```

## Usage

```bash
# Send a message
agentx run whatsapp-agent "Send a message to John saying I'll be late"

# Read a conversation
agentx run whatsapp-agent "Show me my recent conversation with Alice"

# Search messages
agentx run whatsapp-agent "Search for messages about dinner reservation"

# Check unread messages
agentx run whatsapp-agent "What unread messages do I have?"

# Interactive chat session
agentx run whatsapp-agent -i
```

## Configuration

| Key | Description | Default |
|-----|-------------|---------|
| `default_contact` | Default contact for messages | `""` |
| `max_messages` | Max messages to retrieve per conversation | `20` |

## Permissions

- **Network**: Required for WhatsApp bridge communication

## License

MIT
