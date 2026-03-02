#!/usr/bin/env node

/**
 * agent-scaffold CLI
 *
 * Usage:
 *   npx agent-scaffold init [target-dir]     Initialize scaffold in target directory
 *   npx agent-scaffold install-skill         Install as Claude Code global skill
 *   npx agent-scaffold --help                Show help
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, "..");

const MARKER = "# Agent scaffold — runtime files";
const GITIGNORE_RULES = `.birth
.birth.*
.pheromone
.field-breath
*.backup
memory/.cache/
signals/.lock`;

const DIRS = [
  "memory",
  "signals/active",
  "signals/observations",
  "signals/archive",
];

const TEMPLATES = {
  "MEMORY.md": `# Project Memory

Long-term curated knowledge. Write durable facts, preferences, and decisions here.

## Project Facts

## Preferences

## Known Issues`,

  "DECISIONS.md": `# Design Decisions

Record important design decisions (ADR format). Newest first.

## Template

### [YYYY-MM-DD] Decision Title

**Status**: proposed | accepted | deprecated | superseded

**Context**: What is the issue?

**Decision**: What was decided?

**Consequences**: What are the trade-offs?`,

  "WIP.md": `# Work In Progress

Cross-session task handoff. Update before ending a session.

## Current Task

**Status**: not started

## Context for Next Session

## Completed Steps

## Next Steps

## Blockers`,

  "signals/README.md": `# Signals

YAML signal files for cross-session agent communication.

- active/ — Currently claimed tasks
- observations/ — Environment observations
- archive/ — Completed or expired signals`,
};

function log(msg) {
  console.log(`[agent-scaffold] ${msg}`);
}

function err(msg) {
  console.error(`[agent-scaffold] ERROR: ${msg}`);
  process.exit(1);
}

function createIfMissing(filepath, content) {
  if (existsSync(filepath)) {
    log(`Exists, skipped: ${filepath}`);
    return false;
  }
  mkdirSync(dirname(filepath), { recursive: true });
  writeFileSync(filepath, content + "\n", "utf8");
  log(`Created: ${filepath}`);
  return true;
}

function cmdInit(targetDir) {
  const target = resolve(targetDir || process.cwd());

  if (!existsSync(target)) {
    err(`Directory not found: ${target}`);
  }

  log(`Initializing scaffold in: ${target}`);
  console.log();

  let created = 0;
  let skipped = 0;

  // Create directories
  for (const dir of DIRS) {
    const full = join(target, dir);
    if (!existsSync(full)) {
      mkdirSync(full, { recursive: true });
      log(`Created dir: ${dir}/`);
    }
    // .gitkeep
    const gitkeep = join(full, ".gitkeep");
    if (!existsSync(gitkeep)) {
      writeFileSync(gitkeep, "", "utf8");
    }
  }

  // Create template files
  for (const [relPath, content] of Object.entries(TEMPLATES)) {
    const full = join(target, relPath);
    if (createIfMissing(full, content)) {
      created++;
    } else {
      skipped++;
    }
  }

  // Update .gitignore
  const gitignorePath = join(target, ".gitignore");
  if (existsSync(gitignorePath)) {
    const existing = readFileSync(gitignorePath, "utf8");
    if (!existing.includes(MARKER)) {
      appendFileSync(gitignorePath, `\n${MARKER}\n${GITIGNORE_RULES}\n`, "utf8");
      log("Updated .gitignore");
    } else {
      log(".gitignore already has scaffold rules");
    }
  } else {
    writeFileSync(gitignorePath, `${MARKER}\n${GITIGNORE_RULES}\n`, "utf8");
    log("Created .gitignore");
  }

  console.log();
  log(`Done! Created: ${created}, Skipped: ${skipped}`);
  log(`Target: ${target}`);
  console.log();
  log("Next steps:");
  log("  1. Generate CLAUDE.md — tell your AI agent: \"init agent scaffold\"");
  log("  2. Generate AGENTS.md — or create manually from the template");
  log("  3. Review and customize the generated files");
}

function cmdInstallSkill() {
  const skillDir = join(process.env.HOME || "~", ".claude", "skills", "agent-scaffold");

  log(`Installing skill to: ${skillDir}`);

  mkdirSync(skillDir, { recursive: true });

  // Copy SKILL.md and references
  const filesToCopy = [
    "SKILL.md",
    "references/templates.md",
    "scripts/scaffold-init.sh",
  ];

  for (const rel of filesToCopy) {
    const src = join(PACKAGE_ROOT, rel);
    const dst = join(skillDir, rel);

    if (!existsSync(src)) {
      log(`Warning: source not found: ${rel}`);
      continue;
    }

    mkdirSync(dirname(dst), { recursive: true });
    writeFileSync(dst, readFileSync(src));
    log(`Copied: ${rel}`);
  }

  // Make scripts executable
  try {
    execSync(`chmod +x "${join(skillDir, "scripts/scaffold-init.sh")}"`, { stdio: "ignore" });
  } catch {
    // Windows — skip chmod
  }

  console.log();
  log("Claude Code skill installed!");
  log("Usage: tell your AI agent \"init agent scaffold\"");
}

function showHelp() {
  console.log(`
agent-scaffold — AI agent collaboration infrastructure initializer

Usage:
  agent-scaffold init [dir]       Create scaffold in target directory (default: cwd)
  agent-scaffold install-skill    Install as Claude Code global skill (~/.claude/skills/)
  agent-scaffold --help           Show this help

Examples:
  npx agent-scaffold init                  # Scaffold current directory
  npx agent-scaffold init ./my-project     # Scaffold a specific directory
  npx agent-scaffold install-skill         # Install as Claude Code skill

What it creates:
  MEMORY.md, DECISIONS.md, WIP.md, memory/, signals/, .gitignore updates

Note: CLAUDE.md and AGENTS.md are NOT auto-generated by the CLI.
      They require AI agent analysis of your project. After running init,
      tell your AI agent "init agent scaffold" to generate them.
`);
}

// Parse args
const args = process.argv.slice(2);
const cmd = args[0];

switch (cmd) {
  case "init":
    cmdInit(args[1]);
    break;
  case "install-skill":
    cmdInstallSkill();
    break;
  case "--help":
  case "-h":
  case "help":
  case undefined:
    showHelp();
    break;
  default:
    err(`Unknown command: ${cmd}. Run "agent-scaffold --help" for usage.`);
}
