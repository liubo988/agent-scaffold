# Templates Reference

Templates for each file created by the agent-scaffold. The CLI auto-detects project info and fills real values where possible. `TODO` markers are left only for information that cannot be inferred.

## CLAUDE.md Template

```markdown
# Project Instructions

## Overview

<!-- One-line project description -->

**Tech Stack**: <detected language> / <detected frameworks>

## Build & Development Commands

```bash
<install command>                    # Install dependencies
<build command>                      # Build
<dev command>                        # Dev server
<test command>                       # Run tests
<lint command>                       # Lint
<format command>                     # Format
```

## Code Style & Conventions

- **Language**: <detected>
- **Formatter**: <detected> — run before committing
- **Linter**: <detected>
- **Naming**: <detected convention>
- Prefer strict typing; avoid `any` in TypeScript
- Add brief comments for non-obvious logic
- Keep files focused; extract helpers when a file grows too large

## Framework Conventions

<!-- Auto-generated based on detected frameworks (Next.js, FastAPI, Django, etc.) -->

## Testing

- **Framework**: <detected>
- **Run**: `<test command>`
- Run tests before pushing when you touch logic
- E2E tests: <Cypress / Playwright if detected>

## Project Structure

```
project-name/
├── src/                 # source code
├── tests/               # tests
├── docs/                # documentation
├── main.py              # entry point
├── Dockerfile           # container build
```

## Security

- Never commit secrets, API keys, or credentials
- Use environment variables (`.env`) for sensitive config; ensure `.env` is in `.gitignore`
- Validate all external input; avoid SQL injection, XSS, and command injection

## Memory & Signal System

This project uses file-system based memory for cross-session AI agent collaboration:

- `MEMORY.md` — Long-term project facts, patterns, and preferences
- `WIP.md` — Current task handoff (read at session start, update at session end)
- `DECISIONS.md` — Architecture Decision Records
- `signals/active/` — Active task signals (YAML); pick up open tasks here
- `signals/observations/` — Environment observations and tech debt notes
- `memory/` — Daily session logs (`YYYY-MM-DD.md`)

## Agent Work Protocol

1. **Session start**: Read `WIP.md` and scan `signals/active/` for open tasks
2. **During work**: Record decisions in `DECISIONS.md`; create observation signals for discovered issues
3. **Session end**: Update `WIP.md` with progress, next steps, and blockers; archive completed signals
4. **Continuous iteration**: After completing a signal, check `signals/active/` for the next open task

## Commit Guidelines

- Write concise, action-oriented commit messages (e.g. `feat: add user auth`, `fix: null pointer in parser`)
- Group related changes; avoid bundling unrelated refactors
- Run lint and tests before committing
```

## AGENTS.md Template

```markdown
# AGENTS.md

## Project

<!-- One-line project description -->

**Tech Stack**: <detected language> / <detected frameworks>

## Commands

```bash
<install command>                    # Install
<build command>                      # Build
<test command>                       # Test
<lint command>                       # Lint
```

## Architecture

| Directory | Purpose |
|-----------|---------|
| `src/` | source code |
| `tests/` | test files |
| `docs/` | documentation |

**Entry points**: `main.py`, `index.ts`

## Conventions

- **Language**: <detected>
- **Naming**: <detected convention>
- **Formatting**: <detected> — run before committing
- **Linting**: <detected> — fix all warnings
- Follow existing code patterns and naming conventions

## Testing

- **Framework**: <detected>
- **Run**: `<test command>`
- Run tests before committing changes

## Guidelines

- Read existing code before modifying; understand context first
- Prefer editing existing files over creating new ones
- Do not introduce security vulnerabilities
- Never commit secrets, API keys, or credentials
- Run lint + tests before every commit

## Memory & Signal System

| File/Directory | Purpose |
|----------------|---------|
| `MEMORY.md` | Long-term project facts, patterns, preferences |
| `WIP.md` | Current task handoff between sessions |
| `DECISIONS.md` | Architecture Decision Records |
| `signals/active/` | Active task signals (YAML) — pick up open tasks |
| `signals/observations/` | Environment observations, tech debt notes |
| `signals/archive/` | Completed signals |
| `memory/` | Daily session logs (`YYYY-MM-DD.md`) |

## Agent Work Protocol

1. **Session start**: Read `WIP.md` + scan `signals/active/` for open tasks
2. **During work**: Record decisions in `DECISIONS.md`; create observation signals for new issues
3. **Session end**: Update `WIP.md` with progress, next steps, blockers; archive completed signals
4. **Continuous iteration**: After completing a signal, return to `signals/active/` for the next task
```

## MEMORY.md Template

```markdown
# Project Memory

AI Agent cross-session persistent knowledge base. Write durable facts discovered during sessions here.

## How to Use

- **When to write**: Persistent facts, user preferences, recurring patterns, important discoveries
- **When to remove**: Outdated info, corrected entries, or duplicates that have been merged
- **Who maintains**: Every Agent should review and update before ending a session
- **Session logs**: Daily detailed logs go in `memory/YYYY-MM-DD.md`

## Project Facts

<!-- Persistent project-level facts. Examples: -->
<!-- - Primary language: TypeScript (ESM) -->
<!-- - Database: PostgreSQL 15, ORM: Prisma -->
<!-- - Deployment: Docker + Kubernetes on AWS -->
<!-- - API style: REST with OpenAPI spec -->

## Learned Patterns

<!-- Code patterns, gotchas, best practices discovered. Examples: -->
<!-- - Error handling uses AppError class (src/errors.ts) -->
<!-- - Tests use msw for HTTP mocking, not manual fetch stubs -->
<!-- - Config loaded via environment variables, never hardcoded -->

## User Preferences

<!-- User/team preferences. Examples: -->
<!-- - Prefer functional style, avoid classes where possible -->
<!-- - Commit messages in English, PR descriptions in Chinese -->
<!-- - Always run lint before committing -->

## Known Issues

<!-- Known issues and workarounds. Examples: -->
<!-- - CI OOMs on arm64, set NODE_OPTIONS=--max-old-space-size=4096 -->
<!-- - Hot reload breaks when editing config files, restart dev server -->
```

## DECISIONS.md Template

```markdown
# Design Decisions

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

<!-- Add decisions below, newest first -->
```

## WIP.md Template

```markdown
# Work In Progress

Cross-session task handoff. This file is the bridge between agent sessions.

## Agent Protocol

1. **Session start**: Read this file + scan `signals/active/` for open tasks
2. **During work**: Update "Completed Steps" at important milestones
3. **Session end**: Update ALL fields below so the next agent can continue seamlessly

## Current Task

**Title**: <!-- One-line task description -->
**Status**: not started | in progress | blocked | done
**Priority**: low | medium | high | critical
**Branch**: `main`
**Related Signal**: <!-- signals/active/xxx.yaml if applicable -->

## Context for Next Session

<!-- What does the next agent need to know to continue? Include:
- Current progress point
- Why you stopped (time limit / blocked / waiting for feedback)
- Key files and line numbers
- Gotchas to watch out for -->

## Completed Steps

<!-- Steps completed so far, in chronological order -->

## Next Steps

<!-- What should be done next, in priority order -->
<!-- - [ ] Step 1: ... -->
<!-- - [ ] Step 2: ... -->

## Blockers

<!-- Blocking issues and possible solutions -->
```

## signals/README.md Template

```markdown
# Signals — Signal-Driven Agent Collaboration

Cross-session agent communication based on stigmergy (biological pheromone) patterns.

## Directory Structure

- `active/` — Active tasks and claims
- `observations/` — Environment observations (perf issues, tech debt, discovered patterns)
- `archive/` — Completed or expired signals

## Signal YAML Schema

Each signal is a standalone YAML file:

    id: fix-login-timeout
    type: task | observation | alert
    author: human | claude | codex | copilot
    created: 2026-03-02T10:00:00Z
    priority: low | medium | high | critical
    status: open | claimed | in-progress | done | expired
    tags: [auth, bug, backend]
    context: |
      Description of what needs to be done or what was observed.
      Include relevant file paths and line numbers.
    acceptance: |
      - Criteria for completion
      - Measurable outcomes
    claimed_by: ""
    claimed_at: ""
    resolved_at: ""

## Agent Work Loop (Continuous Iteration)

Agents follow this cycle for continuous work:

### 1. Read Signals
- Scan `signals/active/` for all `.yaml` files
- Sort by priority: critical > high > medium > low
- Pick the highest-priority task with `status: open`

### 2. Claim Signal
- Update YAML: `status: claimed`, `claimed_by: <agent>`, `claimed_at: <now>`
- Update `WIP.md` Current Task section

### 3. Execute Task
- Update YAML: `status: in-progress`
- Do the work; record progress in `WIP.md`
- Create new observation signals for any issues discovered along the way

### 4. Archive & Next
- Update YAML: `status: done`, `resolved_at: <now>`
- Move file to `signals/archive/`
- Update `WIP.md` and `MEMORY.md` with learnings
- Return to Step 1 — pick up the next signal

## Signal Types

### Task
`signals/active/fix-login-timeout.yaml` — Work that needs to be done.

### Observation
`signals/observations/slow-test-suite.yaml` — Something noticed but not urgent.
Observations don't need to be claimed; they are passive knowledge for any agent.

### Alert
`signals/active/security-dep-vuln.yaml` — Urgent issue requiring immediate attention.

## Signal Maintenance

- Tasks unclaimed for 7+ days → review if still needed
- Archived signals older than 30 days → can be cleaned up
- Observations are long-lived; remove only when resolved
```

## Example Signal Files

### signals/active/_example-task.yaml

```yaml
id: example-task
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
claimed_by: ""
claimed_at: ""
resolved_at: ""
```

### signals/observations/_example-observation.yaml

```yaml
id: example-observation
type: observation
author: agent
created: 2026-01-01T00:00:00Z
priority: low
status: open
tags: [example]
context: |
  This is an example observation signal. Replace or delete this file.
  Agents create observations when they notice issues, patterns, or tech debt.
  Observations don't need to be claimed — they are passive knowledge.
```

## .gitignore Additions

```
# Agent scaffold — runtime files
.birth
.birth.*
.pheromone
.field-breath
*.backup
memory/.cache/
signals/.lock
```
