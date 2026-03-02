---
name: agent-scaffold
description: >-
  Initialize AI agent memory infrastructure for any project.
  Sets up CLAUDE.md, AGENTS.md, memory directory, decision log,
  WIP handoff, and signal system. Use when starting a new project,
  onboarding AI agents to an existing codebase, or when user says
  "init agent scaffold", "initialize project for AI", "set up agent memory",
  "agent scaffold", "scaffold project", "project init for agents".
---

# Agent Scaffold

One-command initialization of AI agent collaboration infrastructure for any project. Combines the AGENTS.md interoperability standard, structured memory layout, signal system (inspired by stigmergy/pheromone patterns), and decision logging.

## When to Use

- Starting a new development project
- Onboarding AI agents to an existing codebase that lacks CLAUDE.md / AGENTS.md
- Setting up cross-session memory for multi-agent workflows
- User says "init scaffold", "set up agent memory", "initialize project for AI"

## Initialization Workflow

Run these 6 steps in order. If a file already exists, **do not overwrite** it — only create missing files.

### Step 1: Analyze Project

Before generating any files, understand the project:

1. Check for existing config files: `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `Makefile`, `CMakeLists.txt`, `build.gradle`, `pom.xml`, etc.
2. Detect primary language and framework
3. Identify build/test/lint commands from config files
4. Check git status (`git rev-parse --is-inside-work-tree`)
5. Scan existing directory structure (`ls -la`, check for `src/`, `lib/`, `tests/`, `docs/`)
6. Check for existing `CLAUDE.md`, `AGENTS.md`, `MEMORY.md`

Store findings mentally for use in Steps 2-5.

### Step 2: Generate CLAUDE.md

Only create if `CLAUDE.md` does not exist. See [templates.md](references/templates.md) for the full template.

Key sections to include:
- **Project overview**: one-line description
- **Build & dev commands**: install, build, test, lint, format (from Step 1 analysis)
- **Code style**: language conventions, naming, formatting tools
- **Testing**: framework, run command, coverage expectations
- **Architecture**: key directories and their purposes

Fill in real values from Step 1 analysis. Leave `TODO` markers only for information you cannot infer.

### Step 3: Generate AGENTS.md

Only create if `AGENTS.md` does not exist. This follows the [AGENTS.md standard](https://agents.md/) supported by 8+ AI agents (Claude Code, Codex, Gemini, Copilot, Cursor, Devin, Jules, etc.).

Content should mirror CLAUDE.md but use agent-neutral language (no Claude-specific references). See [templates.md](references/templates.md) for the template.

### Step 4: Create Memory Directory Structure

Run the scaffold script or create manually:

```bash
# Option A: Run the bundled script
bash "<SKILL_DIR>/scripts/scaffold-init.sh" "<PROJECT_DIR>"

# Option B: Manual creation
mkdir -p memory signals/active signals/observations signals/archive
```

Create these files if they don't exist:
- `MEMORY.md` — long-term curated memory (see template)
- `memory/.gitkeep` — ensure directory is tracked
- `DECISIONS.md` — design decision record (see template)
- `WIP.md` — cross-session task handoff (see template)

### Step 5: Create Signal Files

Create `signals/README.md` if it doesn't exist:

```markdown
# Signals

YAML files for cross-session agent communication.

- `active/` — Currently claimed tasks (one YAML per task)
- `observations/` — Environment observations (performance issues, tech debt, patterns)
- `archive/` — Completed or expired signals

## Signal Format

Each signal is a YAML file:

    id: <unique-id>
    author: <agent-or-human>
    created: <ISO-8601>
    expires: <ISO-8601 or "never">
    priority: <low|medium|high|critical>
    content: <description>
```

### Step 6: Update .gitignore

Append these rules if not already present (check for marker comment first):

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

## Upgrade Workflow

When the scaffold already exists and user wants to update:

1. Do NOT overwrite `CLAUDE.md`, `AGENTS.md`, `MEMORY.md`, `DECISIONS.md`, `WIP.md`
2. Create any missing directories (`signals/`, `memory/`)
3. Update `signals/README.md` if it doesn't exist
4. Append new `.gitignore` rules if missing
5. Report what was added/skipped

## Post-Init Checklist

After initialization, remind the user:

1. Review and customize `CLAUDE.md` — fill in any `TODO` markers
2. Review `AGENTS.md` — ensure it matches your team's conventions
3. Write initial observations to `MEMORY.md` if anything is known
4. Start working — the agent memory system is ready
