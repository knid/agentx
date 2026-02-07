#!/usr/bin/env bash
# Publish all 5 official starter agents to the agentx registry.
# Prerequisites:
#   1. agentx CLI is built and linked: cd packages/cli && npm link
#   2. You are logged in: agentx login
#   3. The registry is deployed and accessible
#
# Usage:
#   ./scripts/publish-starter-agents.sh

set -euo pipefail

AGENTS_DIR="packages/agents"
AGENTS=("gmail-agent" "github-agent" "data-analyst" "slack-agent" "code-reviewer")

echo "Publishing ${#AGENTS[@]} starter agents..."
echo ""

# Verify login
if ! agentx whoami > /dev/null 2>&1; then
  echo "Error: Not logged in. Run 'agentx login' first."
  exit 1
fi

USERNAME=$(agentx whoami 2>&1)
echo "Logged in as: $USERNAME"
echo ""

# Validate and publish each agent
PUBLISHED=0
FAILED=0

for agent in "${AGENTS[@]}"; do
  AGENT_DIR="$AGENTS_DIR/$agent"

  if [ ! -d "$AGENT_DIR" ]; then
    echo "SKIP: $agent - directory not found"
    continue
  fi

  echo "--- Publishing $agent ---"

  # Validate first
  if ! agentx validate "$AGENT_DIR" 2>&1; then
    echo "FAIL: $agent - validation failed"
    FAILED=$((FAILED + 1))
    continue
  fi

  # Publish
  if agentx publish "$AGENT_DIR" 2>&1; then
    PUBLISHED=$((PUBLISHED + 1))
    echo "OK: $agent published"
  else
    FAILED=$((FAILED + 1))
    echo "FAIL: $agent - publish failed"
  fi

  echo ""
done

echo "=== Summary ==="
echo "Published: $PUBLISHED"
echo "Failed: $FAILED"
echo "Total: ${#AGENTS[@]}"

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
