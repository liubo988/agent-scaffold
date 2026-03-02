# Agent Scaffold

AI Agent 协作基础设施一键初始化工具。为任何项目搭建跨会话记忆、信号系统和决策日志。

One-command AI agent collaboration infrastructure. Sets up cross-session memory, signal system, and decision logging for any project.

## What It Creates

```
your-project/
├── CLAUDE.md              ← AI Agent instructions (Claude Code)
├── AGENTS.md              ← Cross-agent instructions (Codex/Gemini/Copilot)
├── MEMORY.md              ← Long-term curated memory
├── memory/                ← Daily session logs
├── DECISIONS.md           ← Design decision records (ADR)
├── WIP.md                 ← Cross-session task handoff
├── signals/
│   ├── active/            ← Currently claimed tasks
│   ├── observations/      ← Environment observations
│   └── archive/           ← Completed signals
└── .gitignore             ← Updated with runtime exclusions
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

### CLI (works with any AI agent)

```bash
# Initialize current directory
npx agent-scaffold init

# Initialize a specific directory
npx agent-scaffold init ./my-project

# Install as Claude Code skill
npx agent-scaffold install-skill

# Show help
npx agent-scaffold --help
```

The CLI creates the directory structure and template files. Then tell your AI agent to generate `CLAUDE.md` and `AGENTS.md` with project-specific content.

### Claude Code skill

After installing as a skill, just tell Claude in any project:

> "init agent scaffold"

Claude will:
1. Analyze your project (language, framework, build commands)
2. Generate customized `CLAUDE.md` and `AGENTS.md`
3. Create memory directories and signal system
4. Update `.gitignore`

### With Codex / Gemini / Copilot

Run the CLI first, then ask the AI to:

> "Read the AGENTS.md template in this project, analyze the codebase, and generate a customized AGENTS.md"

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
| **Codex** | `npx agent-scaffold init`, then ask to generate AGENTS.md |
| **Gemini** | `npx agent-scaffold init`, then ask to generate AGENTS.md |
| **Copilot** | `npx agent-scaffold init`, then ask to generate AGENTS.md |
| **Cursor** | `npx agent-scaffold init`, then ask to generate AGENTS.md |

## Design Principles

- **Memory as infrastructure**: File system is the persistence layer (inspired by stigmergy/pheromone patterns)
- **AGENTS.md standard**: Compatible with 8+ AI agents via the Linux Foundation Agentic AI Foundation standard
- **Idempotent**: Never overwrites existing files; safe to re-run
- **Zero dependencies**: Pure Node.js, no external packages required
- **Self-contained**: No remote downloads at runtime

## License

MIT
