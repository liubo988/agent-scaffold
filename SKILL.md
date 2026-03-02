---
name: agent-scaffold
description: "Initialize AI agent memory infrastructure for any project. Sets up CLAUDE.md, AGENTS.md, memory directory, decision log, and WIP handoff. Supports monorepos. Use when starting a new project, onboarding AI agents to an existing codebase, or when user says init agent scaffold, initialize project for AI, set up agent memory, agent scaffold, scaffold project, project init for agents."
---

# Agent Scaffold

One-command initialization of AI agent collaboration infrastructure for any project. Combines the AGENTS.md interoperability standard, structured memory layout, and decision logging.

## When to Use

- Starting a new development project
- Onboarding AI agents to an existing codebase that lacks CLAUDE.md / AGENTS.md
- Setting up cross-session memory for multi-agent workflows
- User says "init scaffold", "set up agent memory", "initialize project for AI"

## Initialization Workflow

Run these steps in order. If a file already exists, **do not overwrite** it — only create missing files.

### Step 1: Analyze Project

Before generating any files, understand the project:

1. Check for existing config files: `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `build.gradle`, `pom.xml`, etc.
2. Detect primary language and framework
3. **Check for monorepo**: `pnpm-workspace.yaml`, `lerna.json`, `package.json#workspaces`, or multiple subdirs with `package.json`
4. For monorepos: scan each workspace package for deps, scripts, and frameworks
5. Identify build/test/lint commands from config files
6. Check git status (`git rev-parse --is-inside-work-tree`)
7. Scan existing directory structure
8. Check for existing `CLAUDE.md`, `AGENTS.md`, `MEMORY.md`

### Step 2: Generate CLAUDE.md

Only create if `CLAUDE.md` does not exist. See [templates.md](references/templates.md) for the full template.

Key sections to include:
- **Project overview**: one-line description + tech stack (include monorepo type if applicable)
- **Build & dev commands**: install, build, test, lint, format (from Step 1 analysis)
- **Workspace commands**: for monorepos, list per-workspace dev/build/test commands
- **Code style**: language conventions, naming, formatting tools
- **Framework conventions**: framework-specific best practices
- **Testing**: framework, run command
- **Architecture**: key directories and their purposes
- **Memory system**: MEMORY.md, WIP.md, DECISIONS.md, memory/
- **Agent work protocol**: session start → during work → session end

Fill in real values from Step 1 analysis. Leave `TODO` markers only for information you cannot infer.

### Step 3: Generate AGENTS.md

Only create if `AGENTS.md` does not exist. This follows the [AGENTS.md standard](https://agents.md/) supported by 8+ AI agents.

Content should mirror CLAUDE.md but use agent-neutral language. See [templates.md](references/templates.md) for the template.

### Step 4: Create Memory Directory Structure

```bash
mkdir -p memory
```

Create these files if they don't exist:
- `MEMORY.md` — long-term curated memory, **pre-fill Project Facts with detected info** (language, framework, package manager, etc.)
- `memory/.gitkeep` — ensure directory is tracked
- `DECISIONS.md` — design decision record (see template)
- `WIP.md` — cross-session task handoff (see template)

### Step 5: Update .gitignore

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

### Step 6 (Optional): Signal System

Only if the user explicitly requests signals (`--signals` flag or asks for task coordination):

```bash
mkdir -p signals/active signals/observations signals/archive
```

Create `signals/README.md` with YAML signal schema and agent work loop documentation.

## Upgrade Workflow

When the scaffold already exists and user wants to update:

1. Do NOT overwrite `CLAUDE.md`, `AGENTS.md`, `MEMORY.md`, `DECISIONS.md`, `WIP.md`
2. Create any missing directories (`memory/`)
3. Append new `.gitignore` rules if missing
4. Report what was added/skipped

## Post-Init Checklist

After initialization, remind the user:

1. Review and customize `CLAUDE.md` — fill in any `TODO` markers
2. Review `AGENTS.md` — ensure it matches your team's conventions
3. Review `MEMORY.md` — verify detected project facts are correct
4. Start working — the agent memory system is ready
