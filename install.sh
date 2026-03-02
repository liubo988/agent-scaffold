#!/usr/bin/env bash
# install.sh — Install agent-scaffold as a Claude Code global skill
#
# Usage:
#   # From a clone:
#   bash install.sh
#
#   # One-liner (replace with your repo URL):
#   bash <(curl -fsSL https://raw.githubusercontent.com/<OWNER>/agent-scaffold/main/install.sh)

set -euo pipefail

SKILL_NAME="agent-scaffold"
SKILL_DIR="${HOME}/.claude/skills/${SKILL_NAME}"
REPO_URL="${AGENT_SCAFFOLD_REPO:-https://github.com/<OWNER>/agent-scaffold.git}"

log() { echo "[${SKILL_NAME}] $*"; }
err() { echo "[${SKILL_NAME}] ERROR: $*" >&2; exit 1; }

# Detect if running from inside a clone or via curl pipe
SCRIPT_DIR=""
if [ -n "${BASH_SOURCE[0]:-}" ] && [ "${BASH_SOURCE[0]}" != "bash" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

if [ -n "$SCRIPT_DIR" ] && [ -f "${SCRIPT_DIR}/SKILL.md" ]; then
  # Running from a local clone — symlink or copy
  log "Installing from local clone: ${SCRIPT_DIR}"

  mkdir -p "$(dirname "$SKILL_DIR")"

  if [ -L "$SKILL_DIR" ] || [ -d "$SKILL_DIR" ]; then
    log "Removing existing install at ${SKILL_DIR}"
    rm -rf "$SKILL_DIR"
  fi

  # Symlink to the clone so git pull updates the skill
  ln -sf "$SCRIPT_DIR" "$SKILL_DIR"
  log "Symlinked: ${SKILL_DIR} -> ${SCRIPT_DIR}"

else
  # Running via curl pipe — clone the repo
  log "Installing from remote: ${REPO_URL}"

  if echo "$REPO_URL" | grep -q '<OWNER>'; then
    err "Please set AGENT_SCAFFOLD_REPO or replace <OWNER> in install.sh with your GitHub username/org."
  fi

  if ! command -v git &>/dev/null; then
    err "git is required. Install it first."
  fi

  mkdir -p "$(dirname "$SKILL_DIR")"

  if [ -d "$SKILL_DIR" ]; then
    log "Updating existing installation..."
    cd "$SKILL_DIR" && git pull --rebase origin main
  else
    git clone "$REPO_URL" "$SKILL_DIR"
  fi
fi

# Verify
if [ -f "${SKILL_DIR}/SKILL.md" ]; then
  log "Installed successfully at: ${SKILL_DIR}"
  log ""
  log "Usage: In any project, tell your AI agent:"
  log "  \"init agent scaffold\" or \"initialize project for AI\""
  log ""
  log "Update: cd ${SKILL_DIR} && git pull"
else
  err "Installation failed — SKILL.md not found at ${SKILL_DIR}"
fi
