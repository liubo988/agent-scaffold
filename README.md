# Agent Scaffold

AI Agent 协作基础设施一键初始化工具。为任何项目搭建跨会话记忆和决策日志。

One-command AI agent collaboration infrastructure. Sets up cross-session memory, decision logging, and optional signal system for any project.

## What It Creates

```
your-project/
├── CLAUDE.md              ← AI Agent instructions (Claude Code)
├── AGENTS.md              ← Cross-agent instructions (Codex/Gemini/Copilot)
├── MEMORY.md              ← Long-term curated memory (pre-filled with detected facts)
├── memory/                ← Daily session logs
├── DECISIONS.md           ← Design decision records (ADR)
├── WIP.md                 ← Cross-session task handoff
└── .gitignore             ← Updated with runtime exclusions

# With --signals flag:
├── signals/
│   ├── active/            ← Currently claimed tasks (YAML)
│   ├── observations/      ← Environment observations
│   └── archive/           ← Completed signals
```

## Install

### Method 1: npx (zero install, any AI agent)

```bash
npx agent-scaffold init
```

Works with **any** AI agent — Claude, Codex, Gemini, Copilot, Cursor.

### Method 2: Global npm install

```bash
npm install -g agent-scaffold

# Then in any project:
agent-scaffold init
```

### Method 3: Claude Code skill (recommended for Claude users)

```bash
npx agent-scaffold install-skill
```

This copies the skill to `~/.claude/skills/agent-scaffold/`. Then in any project, just tell Claude: **"init agent scaffold"** — Claude will analyze your project and generate customized files.

### Method 4: Git clone (for contributors)

```bash
git clone https://github.com/liubo988/agent-scaffold.git ~/agent-scaffold
bash ~/agent-scaffold/install.sh
```

## Usage

### CLI

```bash
# Initialize current directory
npx agent-scaffold init

# Initialize a specific directory
npx agent-scaffold init ./my-project

# Include signal-driven task coordination system
npx agent-scaffold init --signals

# Minimal output: only CLAUDE.md + AGENTS.md + .gitignore
npx agent-scaffold init --slim

# Check scaffold health
npx agent-scaffold doctor

# Install as Claude Code skill
npx agent-scaffold install-skill
```

### Auto-Detection

The CLI auto-detects your project and generates customized files:

- **Languages**: Node.js/TypeScript, Python, Rust, Go, Java/Kotlin
- **Frameworks**: Next.js, React, Vue, Express, NestJS, Django, FastAPI, Flask, etc.
- **Monorepos**: pnpm workspaces, npm workspaces, Lerna, multi-package
- **Tools**: ESLint, Prettier, Biome, Ruff, Clippy, etc.
- **Infrastructure**: Docker, CI/CD pipelines

### Claude Code Skill

After installing as a skill, just tell Claude in any project:

> "init agent scaffold"

Claude will:
1. Analyze your project (language, framework, build commands)
2. Generate customized `CLAUDE.md` and `AGENTS.md`
3. Create memory directories and template files
4. Update `.gitignore`

### With Codex / Gemini / Copilot

Run the CLI first, then ask the AI to:

> "Read the AGENTS.md in this project, analyze the codebase, and customize it"

## Options

| Flag | Description |
|------|-------------|
| `--signals` | Enable signal-driven task coordination (`signals/` directory with YAML task files) |
| `--slim` | Minimal output: only CLAUDE.md + AGENTS.md + .gitignore update |

## Health Check

```bash
npx agent-scaffold doctor
```

Validates your scaffold setup and reports any missing or broken components.

## Team Rollout

Share one command with your team:

```bash
npm install -g agent-scaffold
```

Or for Claude Code users:

```bash
npx agent-scaffold install-skill
```

Everyone gets the same scaffold across all projects. No per-project setup needed.

## Update

```bash
npm update -g agent-scaffold
```

## Cross-Agent Compatibility

| Agent | How to use |
|-------|-----------|
| **Claude Code** | Install as skill, say "init agent scaffold" |
| **Codex** | `npx agent-scaffold init`, then ask to customize AGENTS.md |
| **Gemini** | `npx agent-scaffold init`, then ask to customize AGENTS.md |
| **Copilot** | `npx agent-scaffold init`, then ask to customize AGENTS.md |
| **Cursor** | `npx agent-scaffold init`, then ask to customize AGENTS.md |

## Design Principles

- **Memory as infrastructure**: File system is the persistence layer
- **AGENTS.md standard**: Compatible with 8+ AI agents via the Linux Foundation Agentic AI Foundation standard
- **Monorepo aware**: Scans workspace packages and generates per-workspace commands
- **Idempotent**: Never overwrites existing files; safe to re-run
- **Zero dependencies**: Pure Node.js, no external packages required
- **Signal system opt-in**: Task coordination via `--signals` for advanced multi-agent workflows

## License

MIT
