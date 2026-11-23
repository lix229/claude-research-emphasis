#!/usr/bin/env bash
# Installs the emphasis plugin for Claude Code from this folder and imports its reply rules
# into your user CLAUDE.md. Safe to run again: each step skips what is already done.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
CLAUDE_MD="$CLAUDE_DIR/CLAUDE.md"
IMPORT="@$REPO/reply-style.md"

command -v claude >/dev/null || { echo "claude (Claude Code) is not on PATH" >&2; exit 1; }

echo "1/2  Registering this folder as a plugin marketplace and installing the plugin (user scope)"
claude plugin marketplace add "$REPO" || true   # already added is fine
claude plugin install emphasis@claude-research-emphasis --scope user

echo "2/2  Importing the reply rules into $CLAUDE_MD"
mkdir -p "$CLAUDE_DIR"
if [ -f "$CLAUDE_MD" ] && grep -qF "$IMPORT" "$CLAUDE_MD"; then
  echo "     already imported"
else
  printf '\n## Reply style (emphasis)\nReplies are drawn by the emphasis plugin. Follow its rules:\n%s\n' "$IMPORT" >> "$CLAUDE_MD"
  echo "     added: $IMPORT"
fi

echo
echo "Done. Start a new Claude Code session (running sessions pick it up after /exit and claude --continue)."
