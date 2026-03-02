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
import { join, dirname, resolve, basename } from "node:path";
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
    log(`Exists, skipped: ${basename(filepath)}`);
    return false;
  }
  mkdirSync(dirname(filepath), { recursive: true });
  writeFileSync(filepath, content + "\n", "utf8");
  log(`Created: ${basename(filepath)}`);
  return true;
}

// --------------- Project Detection ---------------

function detectProject(target) {
  const info = {
    name: basename(target),
    language: null,
    framework: null,
    install: null,
    build: null,
    dev: null,
    test: null,
    lint: null,
    format: null,
    typecheck: null,
    formatter: null,
    linter: null,
    testFramework: null,
    naming: null,
    srcDirs: [],
  };

  // Detect source directories
  for (const dir of ["src", "lib", "app", "apps", "packages", "components", "pages", "routes"]) {
    if (existsSync(join(target, dir))) info.srcDirs.push(dir);
  }
  if (existsSync(join(target, "tests")) || existsSync(join(target, "test")) || existsSync(join(target, "__tests__"))) {
    info.srcDirs.push("tests");
  }
  if (existsSync(join(target, "docs"))) info.srcDirs.push("docs");

  // --- Node.js / TypeScript ---
  const pkgPath = join(target, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const scripts = pkg.scripts || {};

      // Language
      if (deps.typescript || existsSync(join(target, "tsconfig.json"))) {
        info.language = "TypeScript";
        info.naming = "camelCase for functions, PascalCase for types/components";
      } else {
        info.language = "JavaScript";
        info.naming = "camelCase for functions and variables";
      }

      // Framework
      if (deps.next) info.framework = "Next.js";
      else if (deps.nuxt) info.framework = "Nuxt";
      else if (deps.react) info.framework = "React";
      else if (deps.vue) info.framework = "Vue";
      else if (deps.svelte || deps["@sveltejs/kit"]) info.framework = "SvelteKit";
      else if (deps.express) info.framework = "Express";
      else if (deps.fastify) info.framework = "Fastify";
      else if (deps.nest || deps["@nestjs/core"]) info.framework = "NestJS";
      else if (deps.electron) info.framework = "Electron";

      // Package manager
      if (existsSync(join(target, "pnpm-lock.yaml"))) {
        info.install = "pnpm install";
      } else if (existsSync(join(target, "bun.lockb")) || existsSync(join(target, "bun.lock"))) {
        info.install = "bun install";
      } else if (existsSync(join(target, "yarn.lock"))) {
        info.install = "yarn install";
      } else {
        info.install = "npm install";
      }
      const pm = info.install.split(" ")[0]; // pnpm | bun | yarn | npm

      // Scripts detection
      if (scripts.build) info.build = `${pm} run build`;
      if (scripts.dev) info.dev = `${pm} run dev`;
      else if (scripts.start) info.dev = `${pm} start`;
      if (scripts.test) info.test = `${pm} test`;
      if (scripts.lint) info.lint = `${pm} run lint`;
      if (scripts.format) info.format = `${pm} run format`;
      if (scripts.typecheck || scripts["type-check"]) info.typecheck = `${pm} run typecheck`;

      // Test framework
      if (deps.vitest) info.testFramework = "Vitest";
      else if (deps.jest) info.testFramework = "Jest";
      else if (deps.mocha) info.testFramework = "Mocha";

      // Linter / Formatter
      if (deps.oxlint) info.linter = "Oxlint";
      else if (deps.eslint) info.linter = "ESLint";
      else if (deps.biome || deps["@biomejs/biome"]) { info.linter = "Biome"; info.formatter = "Biome"; }

      if (!info.formatter) {
        if (deps.prettier) info.formatter = "Prettier";
        else if (deps.oxfmt) info.formatter = "Oxfmt";
      }
    } catch { /* ignore parse errors */ }
  }

  // --- Python ---
  const pyprojectPath = join(target, "pyproject.toml");
  const requirementsPath = join(target, "requirements.txt");
  if (existsSync(pyprojectPath) || existsSync(requirementsPath)) {
    info.language = info.language || "Python";
    info.naming = info.naming || "snake_case for functions and variables, PascalCase for classes";

    if (existsSync(pyprojectPath)) {
      try {
        const content = readFileSync(pyprojectPath, "utf8");
        if (content.includes("[tool.poetry]")) info.install = "poetry install";
        else if (content.includes("[tool.pdm]")) info.install = "pdm install";
        else info.install = info.install || "pip install -e .";

        if (content.includes("django")) info.framework = "Django";
        else if (content.includes("fastapi")) info.framework = "FastAPI";
        else if (content.includes("flask")) info.framework = "Flask";

        if (content.includes("[tool.pytest]") || content.includes("pytest")) info.testFramework = "pytest";
        if (content.includes("ruff")) { info.linter = "Ruff"; info.formatter = "Ruff"; }
        else if (content.includes("black")) info.formatter = "Black";
        if (content.includes("mypy")) info.typecheck = "mypy .";
      } catch { /* ignore */ }
    }

    info.test = info.test || (info.testFramework === "pytest" ? "pytest" : null);
    info.lint = info.lint || (info.linter === "Ruff" ? "ruff check ." : null);
    info.format = info.format || (info.formatter === "Ruff" ? "ruff format ." : info.formatter === "Black" ? "black ." : null);
  }

  // --- Rust ---
  if (existsSync(join(target, "Cargo.toml"))) {
    info.language = "Rust";
    info.install = "cargo build";
    info.build = "cargo build --release";
    info.test = "cargo test";
    info.lint = "cargo clippy";
    info.format = "cargo fmt";
    info.formatter = "rustfmt";
    info.linter = "Clippy";
    info.testFramework = "cargo test (built-in)";
    info.naming = "snake_case for functions, PascalCase for types";
  }

  // --- Go ---
  if (existsSync(join(target, "go.mod"))) {
    info.language = "Go";
    info.install = "go mod download";
    info.build = "go build ./...";
    info.test = "go test ./...";
    info.lint = "golangci-lint run";
    info.format = "gofmt -w .";
    info.formatter = "gofmt";
    info.linter = "golangci-lint";
    info.testFramework = "go test (built-in)";
    info.naming = "camelCase for unexported, PascalCase for exported";
  }

  // --- Java ---
  if (existsSync(join(target, "pom.xml"))) {
    info.language = "Java";
    info.install = "mvn install";
    info.build = "mvn package";
    info.test = "mvn test";
    info.framework = info.framework || "Maven";
    info.naming = "camelCase for methods, PascalCase for classes";
  } else if (existsSync(join(target, "build.gradle")) || existsSync(join(target, "build.gradle.kts"))) {
    info.language = info.language || "Java/Kotlin";
    info.install = "gradle build";
    info.build = "gradle build";
    info.test = "gradle test";
    info.framework = info.framework || "Gradle";
    info.naming = "camelCase for methods, PascalCase for classes";
  }

  return info;
}

// --------------- Generate CLAUDE.md ---------------

function generateClaudeMd(info) {
  const lines = ["# Project Instructions", ""];
  lines.push(`## Overview`, "", `<!-- ${info.name}: one-line description -->`, "");

  // Build & Dev
  lines.push("## Build & Development", "");
  const cmds = [
    ["Install", info.install],
    ["Build", info.build],
    ["Dev server", info.dev],
    ["Test", info.test],
    ["Lint", info.lint],
    ["Format", info.format],
    ["Type check", info.typecheck],
  ];
  for (const [label, cmd] of cmds) {
    if (cmd) lines.push(`- ${label}: \`${cmd}\``);
  }
  lines.push("");

  // Code Style
  lines.push("## Code Style", "");
  if (info.language) lines.push(`- Language: ${info.language}${info.framework ? ` (${info.framework})` : ""}`);
  if (info.formatter) lines.push(`- Formatting: ${info.formatter}`);
  if (info.linter) lines.push(`- Linting: ${info.linter}`);
  if (info.naming) lines.push(`- Naming: ${info.naming}`);
  lines.push("");

  // Testing
  lines.push("## Testing", "");
  if (info.testFramework) lines.push(`- Framework: ${info.testFramework}`);
  if (info.test) lines.push(`- Run: \`${info.test}\``);
  lines.push("- Run tests before pushing when you touch logic");
  lines.push("");

  // Architecture
  lines.push("## Architecture", "");
  if (info.srcDirs.length > 0) {
    for (const dir of info.srcDirs) {
      lines.push(`- \`${dir}/\``);
    }
  } else {
    lines.push("- `src/` — source code");
  }
  lines.push("");

  // Commit
  lines.push("## Commit Guidelines", "");
  lines.push("- Write concise, action-oriented commit messages");
  lines.push("- Group related changes; avoid bundling unrelated refactors");
  lines.push("");

  return lines.join("\n");
}

// --------------- Generate AGENTS.md ---------------

function generateAgentsMd(info) {
  const lines = ["# Agent Instructions", ""];
  lines.push("## Project", "", `<!-- ${info.name}: one-line description -->`, "");

  lines.push("## Commands", "");
  const cmds = [
    ["Install", info.install],
    ["Build", info.build],
    ["Test", info.test],
    ["Lint", info.lint],
  ];
  for (const [label, cmd] of cmds) {
    if (cmd) lines.push(`- ${label}: \`${cmd}\``);
  }
  lines.push("");

  lines.push("## Conventions", "");
  if (info.language) lines.push(`- Language: ${info.language}${info.framework ? ` (${info.framework})` : ""}`);
  lines.push("- Follow existing code patterns and naming conventions");
  lines.push("- Run tests before committing changes");
  lines.push("- Keep commits focused and well-described");
  lines.push("");

  lines.push("## Architecture", "");
  if (info.srcDirs.length > 0) {
    for (const dir of info.srcDirs) {
      lines.push(`- \`${dir}/\``);
    }
  } else {
    lines.push("- `src/` — source code");
  }
  lines.push("");

  lines.push("## Guidelines", "");
  lines.push("- Read existing code before modifying");
  lines.push("- Do not introduce security vulnerabilities");
  lines.push("- Prefer editing existing files over creating new ones");
  lines.push("- Run the test suite after making changes");
  lines.push("");

  return lines.join("\n");
}

// --------------- Commands ---------------

function cmdInit(targetDir) {
  const target = resolve(targetDir || process.cwd());

  if (!existsSync(target)) {
    err(`Directory not found: ${target}`);
  }

  log(`Initializing scaffold in: ${target}`);
  console.log();

  let created = 0;
  let skipped = 0;

  // Step 1: Detect project
  const info = detectProject(target);
  if (info.language) {
    log(`Detected: ${info.language}${info.framework ? ` + ${info.framework}` : ""}`);
  } else {
    log("No known project config found — using generic templates");
  }
  console.log();

  // Step 2: Generate CLAUDE.md
  const claudeMdContent = generateClaudeMd(info);
  if (createIfMissing(join(target, "CLAUDE.md"), claudeMdContent)) {
    created++;
  } else {
    skipped++;
  }

  // Step 3: Generate AGENTS.md
  const agentsMdContent = generateAgentsMd(info);
  if (createIfMissing(join(target, "AGENTS.md"), agentsMdContent)) {
    created++;
  } else {
    skipped++;
  }

  // Step 4: Create directories
  for (const dir of DIRS) {
    const full = join(target, dir);
    if (!existsSync(full)) {
      mkdirSync(full, { recursive: true });
      log(`Created dir: ${dir}/`);
    }
    const gitkeep = join(full, ".gitkeep");
    if (!existsSync(gitkeep)) {
      writeFileSync(gitkeep, "", "utf8");
    }
  }

  // Step 5: Create template files
  for (const [relPath, content] of Object.entries(TEMPLATES)) {
    const full = join(target, relPath);
    if (createIfMissing(full, content)) {
      created++;
    } else {
      skipped++;
    }
  }

  // Step 6: Update .gitignore
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
  log("  1. Review CLAUDE.md and AGENTS.md — fill in the overview and any TODOs");
  log("  2. Customize as needed for your project");
  log("  3. Start working with your AI agent!");
}

function cmdInstallSkill() {
  const skillDir = join(process.env.HOME || "~", ".claude", "skills", "agent-scaffold");

  log(`Installing skill to: ${skillDir}`);

  mkdirSync(skillDir, { recursive: true });

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
  agent-scaffold init [dir]       Initialize scaffold (default: current directory)
  agent-scaffold install-skill    Install as Claude Code global skill
  agent-scaffold --help           Show this help

Examples:
  npx agent-scaffold init                  # Scaffold current directory
  npx agent-scaffold init ./my-project     # Scaffold a specific directory
  npx agent-scaffold install-skill         # Install as Claude Code skill

What it creates:
  CLAUDE.md, AGENTS.md, MEMORY.md, DECISIONS.md, WIP.md,
  memory/, signals/, .gitignore updates

Features:
  - Auto-detects language, framework, build/test/lint commands
  - Generates CLAUDE.md and AGENTS.md with real project values
  - Supports: Node.js/TS, Python, Rust, Go, Java
  - Idempotent: never overwrites existing files
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
