#!/usr/bin/env bash
# scaffold-init.sh — Create agent memory infrastructure directories and placeholder files
#
# Usage:
#   bash scaffold-init.sh [TARGET_DIR]
#
# TARGET_DIR defaults to $PWD. Existing files are never overwritten.

set -euo pipefail

TARGET_DIR="${1:-$PWD}"
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd)" || { echo "ERROR: Directory not found: $1" >&2; exit 1; }

log() { echo "[agent-scaffold] $*"; }

created=0
skipped=0

# Create a file only if it doesn't exist
create_if_missing() {
  local filepath="$1"
  local content="$2"
  local full="${TARGET_DIR}/${filepath}"

  mkdir -p "$(dirname "$full")"

  if [ -f "$full" ]; then
    skipped=$((skipped + 1))
    log "Exists, skipped: ${filepath}"
    return
  fi

  printf '%s\n' "$content" > "$full"
  created=$((created + 1))
  log "Created: ${filepath}"
}

# Create directories
for dir in memory signals/active signals/observations signals/archive; do
  target="${TARGET_DIR}/${dir}"
  if [ ! -d "$target" ]; then
    mkdir -p "$target"
    log "Created dir: ${dir}/"
  fi
done

# Create .gitkeep files for empty directories
for dir in memory signals/active signals/observations signals/archive; do
  gitkeep="${TARGET_DIR}/${dir}/.gitkeep"
  if [ ! -f "$gitkeep" ]; then
    touch "$gitkeep"
  fi
done

# Create MEMORY.md
create_if_missing "MEMORY.md" "# Project Memory

Long-term curated knowledge. Write durable facts, preferences, and decisions here.

## Project Facts

## Preferences

## Known Issues"

# Create DECISIONS.md
create_if_missing "DECISIONS.md" "# Design Decisions

Record important design decisions (ADR format). Newest first.

## Template

### [YYYY-MM-DD] Decision Title

**Status**: proposed | accepted | deprecated | superseded

**Context**: What is the issue?

**Decision**: What was decided?

**Consequences**: What are the trade-offs?"

# Create WIP.md
create_if_missing "WIP.md" "# Work In Progress

Cross-session task handoff. Update before ending a session.

## Current Task

**Status**: not started

## Context for Next Session

## Completed Steps

## Next Steps

## Blockers"

# Create signals/README.md
create_if_missing "signals/README.md" "# Signals

YAML signal files for cross-session agent communication.

- active/ — Currently claimed tasks
- observations/ — Environment observations
- archive/ — Completed or expired signals"

# Update .gitignore
GITIGNORE="${TARGET_DIR}/.gitignore"
MARKER="# Agent scaffold — runtime files"

if [ -f "$GITIGNORE" ]; then
  if ! grep -qF "$MARKER" "$GITIGNORE" 2>/dev/null; then
    printf '\n%s\n%s\n' "$MARKER" ".birth
.birth.*
.pheromone
.field-breath
*.backup
memory/.cache/
signals/.lock" >> "$GITIGNORE"
    log "Updated .gitignore"
  else
    log ".gitignore already has scaffold rules"
  fi
else
  printf '%s\n%s\n' "$MARKER" ".birth
.birth.*
.pheromone
.field-breath
*.backup
memory/.cache/
signals/.lock" > "$GITIGNORE"
  log "Created .gitignore"
fi

# Summary
echo ""
log "Done! Created: ${created}, Skipped: ${skipped}"
log "Target: ${TARGET_DIR}"
echo ""
log "Next: Generate CLAUDE.md and AGENTS.md with project-specific content."
