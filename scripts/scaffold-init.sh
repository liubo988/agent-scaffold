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

AI Agent cross-session persistent knowledge base. Write durable facts discovered during sessions here.

## How to Use

- **When to write**: Persistent facts, user preferences, recurring patterns, important discoveries
- **When to remove**: Outdated info, corrected entries, or duplicates that have been merged
- **Who maintains**: Every Agent should review and update before ending a session
- **Session logs**: Daily detailed logs go in \`memory/YYYY-MM-DD.md\`

## Project Facts

<!-- Persistent project-level facts. Examples: -->
<!-- - Primary language: TypeScript (ESM) -->
<!-- - Database: PostgreSQL 15, ORM: Prisma -->
<!-- - Deployment: Docker + Kubernetes on AWS -->

## Learned Patterns

<!-- Code patterns, gotchas, best practices discovered. Examples: -->
<!-- - Error handling uses AppError class (src/errors.ts) -->
<!-- - Tests use msw for HTTP mocking, not manual fetch stubs -->

## User Preferences

<!-- User/team preferences. Examples: -->
<!-- - Prefer functional style, avoid classes where possible -->
<!-- - Commit messages in English, PR descriptions in Chinese -->

## Known Issues

<!-- Known issues and workarounds. Examples: -->
<!-- - CI OOMs on arm64, set NODE_OPTIONS=--max-old-space-size=4096 -->"

# Create DECISIONS.md
create_if_missing "DECISIONS.md" "# Design Decisions

Architecture Decision Records (ADR). Record important design decisions here. Newest first.

## When to Record

- Choosing between multiple valid approaches
- Adopting or replacing a dependency/framework
- Changing architecture patterns
- Any decision that future agents/developers need to understand

## Template

### [YYYY-MM-DD] Decision Title

**Status**: proposed | accepted | deprecated | superseded

**Context**: What is the issue or question that prompted this decision?

**Options Considered**:
1. Option A — pros/cons
2. Option B — pros/cons

**Decision**: What was decided and why?

**Consequences**: What are the trade-offs? What changes as a result?

---

<!-- Add decisions below, newest first -->"

# Create WIP.md
create_if_missing "WIP.md" "# Work In Progress

Cross-session task handoff. This file is the bridge between agent sessions.

## Agent Protocol

1. **Session start**: Read this file + scan \`signals/active/\` for open tasks
2. **During work**: Update \"Completed Steps\" at important milestones
3. **Session end**: Update ALL fields below so the next agent can continue seamlessly

## Current Task

**Title**: <!-- One-line task description -->
**Status**: not started | in progress | blocked | done
**Priority**: low | medium | high | critical
**Branch**: \`main\`
**Related Signal**: <!-- signals/active/xxx.yaml if applicable -->

## Context for Next Session

<!-- What does the next agent need to know to continue? -->

## Completed Steps

<!-- Steps completed so far, in chronological order -->

## Next Steps

<!-- What should be done next, in priority order -->
<!-- - [ ] Step 1: ... -->
<!-- - [ ] Step 2: ... -->

## Blockers

<!-- Blocking issues and possible solutions -->"

# Create signals/README.md
create_if_missing "signals/README.md" "# Signals — Signal-Driven Agent Collaboration

Cross-session agent communication based on stigmergy (biological pheromone) patterns.

## Directory Structure

- \`active/\` — Active tasks and claims
- \`observations/\` — Environment observations (perf issues, tech debt, discovered patterns)
- \`archive/\` — Completed or expired signals

## Signal YAML Schema

    id: fix-login-timeout
    type: task | observation | alert
    author: human | claude | codex | copilot
    created: 2026-03-02T10:00:00Z
    priority: low | medium | high | critical
    status: open | claimed | in-progress | done | expired
    tags: [auth, bug, backend]
    context: |
      Description of what needs to be done or what was observed.
    acceptance: |
      - Criteria for completion
    claimed_by: \"\"
    claimed_at: \"\"
    resolved_at: \"\"

## Agent Work Loop (Continuous Iteration)

### 1. Read Signals
Scan signals/active/ for .yaml files. Sort by priority: critical > high > medium > low.

### 2. Claim Signal
Update YAML: status: claimed, claimed_by: <agent>, claimed_at: <now>.

### 3. Execute Task
Update YAML: status: in-progress. Do the work. Create observation signals for new issues.

### 4. Archive & Next
Update YAML: status: done. Move to signals/archive/. Return to Step 1.

## Signal Maintenance

- Tasks unclaimed for 7+ days — review if still needed
- Archived signals older than 30 days — can be cleaned up
- Observations are long-lived; remove only when resolved"

# Create example signal files
create_if_missing "signals/active/_example-task.yaml" "id: example-task
type: task
author: human
created: 2026-01-01T00:00:00Z
priority: medium
status: open
tags: [example]
context: |
  This is an example task signal. Replace or delete this file.
  Create real task signals here for agents to pick up and execute.
acceptance: |
  - Task completed successfully
  - Tests pass
claimed_by: \"\"
claimed_at: \"\"
resolved_at: \"\""

create_if_missing "signals/observations/_example-observation.yaml" "id: example-observation
type: observation
author: agent
created: 2026-01-01T00:00:00Z
priority: low
status: open
tags: [example]
context: |
  This is an example observation signal. Replace or delete this file.
  Agents create observations when they notice issues, patterns, or tech debt.
  Observations don't need to be claimed — they are passive knowledge."

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
