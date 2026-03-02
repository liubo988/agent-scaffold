# Templates Reference

Templates for each file created by the agent-scaffold skill. Agent should fill in values from project analysis (Step 1) and leave `TODO` only for information that cannot be inferred.

## CLAUDE.md Template

```markdown
# Project Instructions

## Overview

<!-- One-line project description -->

## Build & Development

- Install: `TODO`
- Build: `TODO`
- Dev server: `TODO`
- Test: `TODO`
- Test single: `TODO`
- Lint: `TODO`
- Format: `TODO`
- Type check: `TODO`

## Code Style

- Language: TODO (e.g., TypeScript ESM, Python 3.12, Rust 2021)
- Formatting: TODO (e.g., Prettier, Black, rustfmt)
- Linting: TODO (e.g., ESLint, Ruff, Clippy)
- Naming: TODO (e.g., camelCase for functions, PascalCase for types)

## Testing

- Framework: TODO (e.g., Vitest, pytest, cargo test)
- Run tests before pushing when you touch logic
- Test files: colocated `*.test.ts` / `tests/` directory

## Architecture

- `src/` — source code
- `tests/` — test files
- `docs/` — documentation

## Commit Guidelines

- Write concise, action-oriented commit messages
- Group related changes; avoid bundling unrelated refactors
```

## AGENTS.md Template

```markdown
# Agent Instructions

## Project

<!-- One-line project description -->

## Commands

- Install: `TODO`
- Build: `TODO`
- Test: `TODO`
- Lint: `TODO`

## Conventions

- Language: TODO
- Follow existing code patterns and naming conventions
- Run tests before committing changes
- Keep commits focused and well-described

## Architecture

- `src/` — source code
- `tests/` — test files
- `docs/` — documentation

## Guidelines

- Read existing code before modifying
- Do not introduce security vulnerabilities
- Prefer editing existing files over creating new ones
- Run the test suite after making changes
```

## MEMORY.md Template

```markdown
# Project Memory

Long-term curated knowledge. Write durable facts, preferences, and decisions here.

## Project Facts

<!-- Key facts about the project that should persist across sessions -->

## Preferences

<!-- User/team preferences discovered during sessions -->

## Known Issues

<!-- Recurring issues or gotchas -->
```

## DECISIONS.md Template

```markdown
# Design Decisions

Record important design decisions using ADR (Architecture Decision Record) format.

## Template

### [YYYY-MM-DD] Decision Title

**Status**: proposed | accepted | deprecated | superseded

**Context**: What is the issue or question?

**Decision**: What was decided?

**Consequences**: What are the trade-offs?

---

<!-- Add decisions below, newest first -->
```

## WIP.md Template

```markdown
# Work In Progress

Cross-session task handoff. Update this file before ending a session.

## Current Task

<!-- What are you working on? -->

**Status**: not started | in progress | blocked | done

**Branch**: `main`

## Context for Next Session

<!-- What does the next agent need to know to continue? -->

## Completed Steps

<!-- What has been done so far? -->

## Next Steps

<!-- What should be done next? -->

## Blockers

<!-- Anything preventing progress? -->
```

## signals/README.md Template

```markdown
# Signals

YAML signal files for cross-session agent communication (stigmergy pattern).

## Directories

- `active/` — Currently claimed tasks. One YAML file per task.
- `observations/` — Environment observations: performance issues, tech debt, patterns discovered.
- `archive/` — Completed or expired signals. Moved here automatically or manually.

## Signal Schema

```yaml
id: unique-signal-id
type: task | observation | alert
author: agent-name-or-human
created: 2026-03-02T00:00:00Z
expires: 2026-03-09T00:00:00Z  # or "never"
priority: low | medium | high | critical
tags: [relevant, tags]
content: |
  Description of the signal.
  Can be multi-line.
status: open | in-progress | resolved | expired
```

## Usage

### Claiming a task

Create `signals/active/<task-id>.yaml` with `status: in-progress` and your agent name as `author`.

### Recording an observation

Create `signals/observations/<observation-id>.yaml` describing what you noticed (e.g., "test suite is slow", "unused dependency detected").

### Archiving

Move completed/expired signals to `signals/archive/`. Include a `resolved_at` timestamp.
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
