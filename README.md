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

### Option A: Clone + symlink (recommended)

```bash
git clone https://github.com/<OWNER>/agent-scaffold.git ~/agent-scaffold
bash ~/agent-scaffold/install.sh
```

This creates a symlink at `~/.claude/skills/agent-scaffold`, so `git pull` updates the skill.

### Option B: Direct clone to skill directory

```bash
git clone https://github.com/<OWNER>/agent-scaffold.git ~/.claude/skills/agent-scaffold
```

### Team rollout

Share this command with your team:

```bash
git clone https://github.com/<OWNER>/agent-scaffold.git ~/.claude/skills/agent-scaffold
```

Everyone who runs this will have the skill available in all their Claude Code sessions.

## Usage

In any project, tell your AI agent:

> "init agent scaffold"

or

> "initialize project for AI"

The agent will:
1. Analyze your project (language, framework, build commands)
2. Generate customized `CLAUDE.md` and `AGENTS.md`
3. Create memory directories and signal system
4. Update `.gitignore`

Existing files are never overwritten. Safe to run multiple times.

## Update

```bash
cd ~/.claude/skills/agent-scaffold && git pull
```

## Standalone Script

You can also run the directory scaffold without the skill:

```bash
bash scripts/scaffold-init.sh /path/to/your/project
```

This creates the directory structure and placeholder files but does NOT generate `CLAUDE.md` or `AGENTS.md` (those require AI agent analysis).

## Design Principles

- **Memory as infrastructure**: File system is the persistence layer (inspired by stigmergy/pheromone patterns)
- **AGENTS.md standard**: Compatible with 8+ AI agents via the Linux Foundation Agentic AI Foundation standard
- **Idempotent**: Never overwrites existing files; safe to re-run
- **Zero dependencies**: Pure bash, no external tools required
- **Self-contained**: No remote downloads at runtime

## License

MIT
