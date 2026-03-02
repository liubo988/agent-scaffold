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
<!-- - Hot reload breaks when editing config files, restart dev server -->`,

  "DECISIONS.md": `# Design Decisions

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

<!-- Add decisions below, newest first -->`,

  "WIP.md": `# Work In Progress

Cross-session task handoff. This file is the bridge between agent sessions.

## Agent Protocol

1. **Session start**: Read this file + scan \`signals/active/\` for open tasks
2. **During work**: Update "Completed Steps" at important milestones
3. **Session end**: Update ALL fields below so the next agent can continue seamlessly

## Current Task

**Title**: <!-- One-line task description -->
**Status**: not started | in progress | blocked | done
**Priority**: low | medium | high | critical
**Branch**: \`main\`
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

<!-- Blocking issues and possible solutions -->`,

  "signals/README.md": `# Signals — Signal-Driven Agent Collaboration

Cross-session agent communication based on stigmergy (biological pheromone) patterns.

## Directory Structure

- \`active/\` — Active tasks and claims
- \`observations/\` — Environment observations (perf issues, tech debt, discovered patterns)
- \`archive/\` — Completed or expired signals

## Signal YAML Schema

Each signal is a standalone YAML file:

\`\`\`yaml
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
\`\`\`

## Agent Work Loop (Continuous Iteration)

Agents follow this cycle for continuous work:

### 1. Read Signals
- Scan \`signals/active/\` for all \`.yaml\` files
- Sort by priority: critical > high > medium > low
- Pick the highest-priority task with \`status: open\`

### 2. Claim Signal
- Update YAML: \`status: claimed\`, \`claimed_by: <agent>\`, \`claimed_at: <now>\`
- Update \`WIP.md\` Current Task section

### 3. Execute Task
- Update YAML: \`status: in-progress\`
- Do the work; record progress in \`WIP.md\`
- Create new observation signals for any issues discovered along the way

### 4. Archive & Next
- Update YAML: \`status: done\`, \`resolved_at: <now>\`
- Move file to \`signals/archive/\`
- Update \`WIP.md\` and \`MEMORY.md\` with learnings
- Return to Step 1 — pick up the next signal

## Signal Types

### Task
\`signals/active/fix-login-timeout.yaml\` — Work that needs to be done.

### Observation
\`signals/observations/slow-test-suite.yaml\` — Something noticed but not urgent.
Observations don't need to be claimed; they are passive knowledge for any agent.

### Alert
\`signals/active/security-dep-vuln.yaml\` — Urgent issue requiring immediate attention.

## Signal Maintenance

- Tasks unclaimed for 7+ days → review if still needed
- Archived signals older than 30 days → can be cleaned up
- Observations are long-lived; remove only when resolved`,

  "signals/active/_example-task.yaml": `id: example-task
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
resolved_at: ""`,

  "signals/observations/_example-observation.yaml": `id: example-observation
type: observation
author: agent
created: 2026-01-01T00:00:00Z
priority: low
status: open
tags: [example]
context: |
  This is an example observation signal. Replace or delete this file.
  Agents create observations when they notice issues, patterns, or tech debt.
  Observations don't need to be claimed — they are passive knowledge.`,
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
    description: "",
    languages: [],      // multi-language support
    framework: null,
    frameworks: [],      // multiple frameworks
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
    testFrameworks: [],  // multiple test frameworks
    naming: null,
    srcDirs: [],
    hasDocker: false,
    hasCi: false,
    hasReadme: false,
    entryPoints: [],
    configFiles: [],
  };

  // --- Read project description from multiple sources ---
  const pkgPath = join(target, "package.json");
  let pkg = null;
  if (existsSync(pkgPath)) {
    try { pkg = JSON.parse(readFileSync(pkgPath, "utf8")); } catch { /* ignore */ }
  }
  if (pkg?.description) {
    info.description = pkg.description;
  }

  // Try setup.py for description
  const setupPyPath = join(target, "setup.py");
  if (!info.description && existsSync(setupPyPath)) {
    try {
      const content = readFileSync(setupPyPath, "utf8");
      const m = content.match(/description\s*=\s*["']([^"']+)["']/);
      if (m) info.description = m[1];
    } catch { /* ignore */ }
  }

  // Try README first paragraph
  for (const readme of ["README.md", "README.rst", "README.txt", "README"]) {
    const readmePath = join(target, readme);
    if (existsSync(readmePath)) {
      info.hasReadme = true;
      if (!info.description) {
        try {
          const content = readFileSync(readmePath, "utf8");
          const lines = content.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            // Skip headings, badges, empty lines, HTML tags
            if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("[!") || trimmed.startsWith("![") || trimmed.startsWith("---") || trimmed.startsWith("<")) continue;
            info.description = trimmed.slice(0, 200);
            break;
          }
        } catch { /* ignore */ }
      }
      break;
    }
  }

  // --- Detect source directories with descriptions ---
  const dirMap = {
    src: "source code",
    lib: "library modules",
    app: "application code",
    apps: "application packages",
    packages: "workspace packages",
    components: "UI components",
    pages: "page routes",
    routes: "route handlers",
    api: "API endpoints",
    services: "service layer",
    models: "data models",
    utils: "utility functions",
    helpers: "helper modules",
    middleware: "middleware",
    hooks: "custom hooks",
    store: "state management",
    styles: "stylesheets",
    public: "static assets",
    static: "static files",
    assets: "project assets",
    config: "configuration",
    scripts: "scripts",
    template: "templates",
    templates: "templates",
    migrations: "database migrations",
    fixtures: "test fixtures",
    workspace: "workspace files",
    examples: "usage examples",
  };
  for (const [dir, desc] of Object.entries(dirMap)) {
    if (existsSync(join(target, dir))) info.srcDirs.push({ name: dir, desc });
  }
  // Test directories
  for (const dir of ["tests", "test", "__tests__", "cypress", "e2e"]) {
    if (existsSync(join(target, dir))) {
      info.srcDirs.push({ name: dir, desc: "tests" });
      break; // only add one test dir label
    }
  }
  if (existsSync(join(target, "docs"))) info.srcDirs.push({ name: "docs", desc: "documentation" });

  // --- Detect Docker, CI, config files ---
  info.hasDocker = existsSync(join(target, "Dockerfile")) || existsSync(join(target, "docker-compose.yml")) || existsSync(join(target, "docker-compose.yaml"));
  info.hasCi = existsSync(join(target, ".github/workflows")) || existsSync(join(target, ".gitlab-ci.yml")) || existsSync(join(target, "Jenkinsfile")) || existsSync(join(target, ".circleci"));

  // Config files
  for (const f of [".env.example", ".editorconfig", "tsconfig.json", "pyproject.toml", "Cargo.toml", "go.mod", ".eslintrc.js", ".eslintrc.json", "biome.json", "ruff.toml"]) {
    if (existsSync(join(target, f))) info.configFiles.push(f);
  }

  // Entry points
  for (const f of ["main.py", "app.py", "server.py", "index.ts", "index.js", "main.ts", "main.go", "main.rs", "src/main.rs", "src/lib.rs"]) {
    if (existsSync(join(target, f))) info.entryPoints.push(f);
  }

  // --- Node.js / TypeScript ---
  if (pkg) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const scripts = pkg.scripts || {};

    // Language
    if (deps.typescript || existsSync(join(target, "tsconfig.json"))) {
      info.languages.push("TypeScript");
    } else {
      info.languages.push("JavaScript");
    }

    // Framework
    if (deps.next) info.frameworks.push("Next.js");
    if (deps.nuxt) info.frameworks.push("Nuxt");
    if (deps.react && !deps.next) info.frameworks.push("React");
    if (deps.vue && !deps.nuxt) info.frameworks.push("Vue");
    if (deps.svelte || deps["@sveltejs/kit"]) info.frameworks.push("SvelteKit");
    if (deps.express) info.frameworks.push("Express");
    if (deps.fastify) info.frameworks.push("Fastify");
    if (deps.nest || deps["@nestjs/core"]) info.frameworks.push("NestJS");
    if (deps.electron) info.frameworks.push("Electron");
    if (deps.cypress) info.testFrameworks.push("Cypress");
    if (deps.playwright || deps["@playwright/test"]) info.testFrameworks.push("Playwright");

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
    const pm = info.install.split(" ")[0];

    // Scripts detection
    if (scripts.build) info.build = `${pm} run build`;
    if (scripts.dev) info.dev = `${pm} run dev`;
    else if (scripts.start) info.dev = `${pm} start`;
    if (scripts.test) info.test = `${pm} test`;
    if (scripts.lint) info.lint = `${pm} run lint`;
    if (scripts.format) info.format = `${pm} run format`;
    if (scripts.typecheck || scripts["type-check"]) info.typecheck = `${pm} run typecheck`;

    // Test framework
    if (deps.vitest) info.testFrameworks.push("Vitest");
    if (deps.jest) info.testFrameworks.push("Jest");
    if (deps.mocha) info.testFrameworks.push("Mocha");

    // Linter / Formatter
    if (deps.oxlint) info.linter = "Oxlint";
    else if (deps.eslint) info.linter = "ESLint";
    else if (deps.biome || deps["@biomejs/biome"]) { info.linter = "Biome"; info.formatter = "Biome"; }

    if (!info.formatter) {
      if (deps.prettier) info.formatter = "Prettier";
      else if (deps.oxfmt) info.formatter = "Oxfmt";
    }
  }

  // --- Python ---
  const pyprojectPath = join(target, "pyproject.toml");
  const requirementsPath = join(target, "requirements.txt");
  if (existsSync(pyprojectPath) || existsSync(requirementsPath) || existsSync(setupPyPath)) {
    if (!info.languages.includes("Python")) info.languages.push("Python");
    info.naming = info.naming || "snake_case for functions/variables, PascalCase for classes";

    // Read requirements.txt for framework detection
    if (existsSync(requirementsPath)) {
      try {
        const content = readFileSync(requirementsPath, "utf8").toLowerCase();
        if (content.includes("django")) info.frameworks.push("Django");
        if (content.includes("fastapi")) info.frameworks.push("FastAPI");
        if (content.includes("flask")) info.frameworks.push("Flask");
        if (content.includes("streamlit")) info.frameworks.push("Streamlit");
        if (content.includes("playwright")) info.testFrameworks.push("Playwright");
        if (content.includes("selenium")) info.testFrameworks.push("Selenium");
        if (content.includes("pytest")) info.testFrameworks.push("pytest");
        if (content.includes("ruff")) { info.linter = info.linter || "Ruff"; info.formatter = info.formatter || "Ruff"; }
        if (content.includes("black")) info.formatter = info.formatter || "Black";
        if (content.includes("flake8")) info.linter = info.linter || "Flake8";
        if (content.includes("mypy")) info.typecheck = info.typecheck || "mypy .";
      } catch { /* ignore */ }
    }

    if (existsSync(pyprojectPath)) {
      try {
        const content = readFileSync(pyprojectPath, "utf8");
        if (content.includes("[tool.poetry]")) info.install = info.install ? `${info.install} && poetry install` : "poetry install";
        else if (content.includes("[tool.pdm]")) info.install = info.install ? `${info.install} && pdm install` : "pdm install";
        else if (!info.install?.includes("pip")) info.install = info.install ? `${info.install} && pip install -e .` : "pip install -e .";

        if (content.includes("django") && !info.frameworks.includes("Django")) info.frameworks.push("Django");
        if (content.includes("fastapi") && !info.frameworks.includes("FastAPI")) info.frameworks.push("FastAPI");
        if (content.includes("flask") && !info.frameworks.includes("Flask")) info.frameworks.push("Flask");

        if ((content.includes("[tool.pytest]") || content.includes("pytest")) && !info.testFrameworks.includes("pytest")) info.testFrameworks.push("pytest");
        if (content.includes("ruff")) { info.linter = info.linter || "Ruff"; info.formatter = info.formatter || "Ruff"; }
        else if (content.includes("black")) info.formatter = info.formatter || "Black";
        if (content.includes("mypy")) info.typecheck = info.typecheck || "mypy .";
      } catch { /* ignore */ }
    }

    // Python commands (only if not already set by JS scripts)
    if (!info.test) {
      if (info.testFrameworks.includes("pytest")) info.test = "pytest";
      else info.test = "python -m pytest";
    }
    if (!info.lint && info.linter === "Ruff") info.lint = "ruff check .";
    if (!info.format) {
      if (info.formatter === "Ruff") info.format = "ruff format .";
      else if (info.formatter === "Black") info.format = "black .";
    }
    if (!info.install) info.install = "pip install -r requirements.txt";
  }

  // --- Rust ---
  if (existsSync(join(target, "Cargo.toml"))) {
    if (!info.languages.includes("Rust")) info.languages.push("Rust");
    info.install = info.install || "cargo build";
    info.build = info.build || "cargo build --release";
    info.test = info.test || "cargo test";
    info.lint = info.lint || "cargo clippy";
    info.format = info.format || "cargo fmt";
    info.formatter = info.formatter || "rustfmt";
    info.linter = info.linter || "Clippy";
    if (!info.testFrameworks.includes("cargo test")) info.testFrameworks.push("cargo test (built-in)");
    info.naming = info.naming || "snake_case for functions, PascalCase for types";
  }

  // --- Go ---
  if (existsSync(join(target, "go.mod"))) {
    if (!info.languages.includes("Go")) info.languages.push("Go");
    info.install = info.install || "go mod download";
    info.build = info.build || "go build ./...";
    info.test = info.test || "go test ./...";
    info.lint = info.lint || "golangci-lint run";
    info.format = info.format || "gofmt -w .";
    info.formatter = info.formatter || "gofmt";
    info.linter = info.linter || "golangci-lint";
    if (!info.testFrameworks.includes("go test")) info.testFrameworks.push("go test (built-in)");
    info.naming = info.naming || "camelCase for unexported, PascalCase for exported";
  }

  // --- Java ---
  if (existsSync(join(target, "pom.xml"))) {
    if (!info.languages.includes("Java")) info.languages.push("Java");
    info.install = info.install || "mvn install";
    info.build = info.build || "mvn package";
    info.test = info.test || "mvn test";
    info.frameworks.push("Maven");
    info.naming = info.naming || "camelCase for methods, PascalCase for classes";
  } else if (existsSync(join(target, "build.gradle")) || existsSync(join(target, "build.gradle.kts"))) {
    if (!info.languages.includes("Java") && !info.languages.includes("Kotlin")) info.languages.push("Java/Kotlin");
    info.install = info.install || "gradle build";
    info.build = info.build || "gradle build";
    info.test = info.test || "gradle test";
    info.frameworks.push("Gradle");
    info.naming = info.naming || "camelCase for methods, PascalCase for classes";
  }

  // Deduplicate frameworks
  info.frameworks = [...new Set(info.frameworks)];
  info.testFrameworks = [...new Set(info.testFrameworks)];

  // Set primary language/framework for backward compat
  if (info.languages.length > 0) info.language = info.languages.join(" + ");
  if (info.frameworks.length > 0) info.framework = info.frameworks.join(" + ");
  if (info.testFrameworks.length > 0) info.testFramework = info.testFrameworks.join(" + ");
  if (!info.naming && info.languages.length > 0) info.naming = "follow existing project conventions";

  return info;
}

// --------------- Framework-Specific Conventions ---------------

function getFrameworkConventions(frameworks) {
  const conventions = [];

  for (const fw of frameworks) {
    switch (fw) {
      case "Next.js":
        conventions.push("- Next.js: use `app/` directory for routes; prefer Server Components; keep client components small");
        conventions.push("- API routes in `app/api/`; use Route Handlers");
        break;
      case "React":
        conventions.push("- React: prefer functional components with hooks; keep components focused and reusable");
        conventions.push("- Custom hooks in `hooks/` directory; shared components in `components/`");
        break;
      case "Vue":
      case "Nuxt":
        conventions.push("- Vue: use Composition API (`<script setup>`); keep components single-responsibility");
        break;
      case "Express":
      case "Fastify":
        conventions.push(`- ${fw}: organize routes by resource; use middleware for cross-cutting concerns`);
        conventions.push("- Separate route handlers, business logic, and data access layers");
        break;
      case "NestJS":
        conventions.push("- NestJS: follow module structure; use decorators for DI; keep controllers thin");
        break;
      case "Django":
        conventions.push("- Django: follow MVT pattern; keep views thin; business logic in models or services");
        conventions.push("- Use Django ORM for database queries; migrations in `migrations/`");
        break;
      case "FastAPI":
        conventions.push("- FastAPI: use Pydantic models for request/response validation; async endpoints where beneficial");
        conventions.push("- Organize routers by domain; dependency injection for shared resources");
        break;
      case "Flask":
        conventions.push("- Flask: use Blueprints for modular organization; keep route handlers focused");
        break;
    }
  }

  return conventions;
}

// --------------- Generate CLAUDE.md ---------------

function generateClaudeMd(info) {
  const lines = ["# Project Instructions", ""];

  // Overview
  lines.push("## Overview", "");
  if (info.description) {
    lines.push(info.description, "");
  } else {
    lines.push(`<!-- TODO: Add a one-line description of ${info.name} -->`, "");
  }
  if (info.language) {
    const parts = [];
    parts.push(`**Tech Stack**: ${info.language}`);
    if (info.framework) parts[0] += ` / ${info.framework}`;
    if (info.hasDocker) parts.push("Docker");
    lines.push(parts.join(" | "), "");
  }

  // Build & Dev
  lines.push("## Build & Development Commands", "");
  lines.push("```bash");
  const cmds = [
    ["Install dependencies", info.install],
    ["Build", info.build],
    ["Dev server", info.dev],
    ["Run tests", info.test],
    ["Lint", info.lint],
    ["Format", info.format],
    ["Type check", info.typecheck],
  ];
  for (const [label, cmd] of cmds) {
    if (cmd) lines.push(`${cmd.padEnd(35)} # ${label}`);
  }
  lines.push("```", "");

  // Code Style
  lines.push("## Code Style & Conventions", "");
  if (info.language) lines.push(`- **Language**: ${info.language}`);
  if (info.formatter) lines.push(`- **Formatter**: ${info.formatter}${info.format ? ` — run \`${info.format}\` before committing` : ""}`);
  if (info.linter) lines.push(`- **Linter**: ${info.linter}${info.lint ? ` — run \`${info.lint}\`` : ""}`);
  if (info.naming) lines.push(`- **Naming**: ${info.naming}`);
  lines.push("- Prefer strict typing; avoid `any` in TypeScript");
  lines.push("- Add brief comments for non-obvious logic");
  lines.push("- Keep files focused; extract helpers when a file grows too large");
  lines.push("");

  // Framework conventions
  if (info.frameworks.length > 0) {
    const fwConventions = getFrameworkConventions(info.frameworks);
    if (fwConventions.length > 0) {
      lines.push("## Framework Conventions", "");
      lines.push(...fwConventions);
      lines.push("");
    }
  }

  // Testing
  lines.push("## Testing", "");
  if (info.testFramework) lines.push(`- **Framework**: ${info.testFramework}`);
  if (info.test) lines.push(`- **Run**: \`${info.test}\``);
  lines.push("- Run tests before pushing when you touch logic");
  lines.push("- Test files colocated with source (e.g. `foo.test.ts` next to `foo.ts`) or in `tests/` directory");
  if (info.testFrameworks.includes("Cypress") || info.testFrameworks.includes("Playwright")) {
    lines.push(`- E2E tests: ${info.testFrameworks.filter(t => t === "Cypress" || t === "Playwright").join(" + ")}`);
  }
  lines.push("");

  // Architecture
  lines.push("## Project Structure", "");
  lines.push("```");
  lines.push(`${info.name}/`);
  if (info.srcDirs.length > 0) {
    for (const dir of info.srcDirs) {
      lines.push(`├── ${dir.name.padEnd(20)} # ${dir.desc}`);
    }
  }
  if (info.entryPoints.length > 0) {
    for (const ep of info.entryPoints) {
      lines.push(`├── ${ep.padEnd(20)} # entry point`);
    }
  }
  if (info.hasDocker) lines.push(`├── ${"Dockerfile".padEnd(20)} # container build`);
  if (info.configFiles.length > 0) {
    for (const cf of info.configFiles.slice(0, 5)) {
      lines.push(`├── ${cf}`);
    }
  }
  lines.push("```", "");

  // Security
  lines.push("## Security", "");
  lines.push("- Never commit secrets, API keys, or credentials");
  lines.push("- Use environment variables (`.env`) for sensitive config; ensure `.env` is in `.gitignore`");
  lines.push("- Validate all external input; avoid SQL injection, XSS, and command injection");
  lines.push("");

  // Memory & Signal System
  lines.push("## Memory & Signal System", "");
  lines.push("This project uses file-system based memory for cross-session AI agent collaboration:", "");
  lines.push("- `MEMORY.md` — Long-term project facts, patterns, and preferences");
  lines.push("- `WIP.md` — Current task handoff (read at session start, update at session end)");
  lines.push("- `DECISIONS.md` — Architecture Decision Records");
  lines.push("- `signals/active/` — Active task signals (YAML); pick up open tasks here");
  lines.push("- `signals/observations/` — Environment observations and tech debt notes");
  lines.push("- `memory/` — Daily session logs (`YYYY-MM-DD.md`)");
  lines.push("");

  // Agent Work Protocol
  lines.push("## Agent Work Protocol", "");
  lines.push("1. **Session start**: Read `WIP.md` and scan `signals/active/` for open tasks");
  lines.push("2. **During work**: Record decisions in `DECISIONS.md`; create observation signals for discovered issues");
  lines.push("3. **Session end**: Update `WIP.md` with progress, next steps, and blockers; archive completed signals");
  lines.push("4. **Continuous iteration**: After completing a signal, check `signals/active/` for the next open task");
  lines.push("");

  // Commit
  lines.push("## Commit Guidelines", "");
  lines.push("- Write concise, action-oriented commit messages (e.g. `feat: add user auth`, `fix: null pointer in parser`)");
  lines.push("- Group related changes; avoid bundling unrelated refactors");
  lines.push("- Run lint and tests before committing");
  lines.push("");

  return lines.join("\n");
}

// --------------- Generate AGENTS.md ---------------

function generateAgentsMd(info) {
  const lines = ["# AGENTS.md", ""];

  // Project overview
  lines.push("## Project", "");
  if (info.description) {
    lines.push(info.description, "");
  } else {
    lines.push(`<!-- TODO: Add a one-line description of ${info.name} -->`, "");
  }
  if (info.language) {
    lines.push(`**Tech Stack**: ${info.language}${info.framework ? ` / ${info.framework}` : ""}`, "");
  }

  // Commands
  lines.push("## Commands", "");
  lines.push("```bash");
  const cmds = [
    ["Install", info.install],
    ["Build", info.build],
    ["Dev", info.dev],
    ["Test", info.test],
    ["Lint", info.lint],
    ["Format", info.format],
    ["Typecheck", info.typecheck],
  ];
  for (const [label, cmd] of cmds) {
    if (cmd) lines.push(`${cmd.padEnd(35)} # ${label}`);
  }
  lines.push("```", "");

  // Architecture
  lines.push("## Architecture", "");
  if (info.srcDirs.length > 0) {
    lines.push("| Directory | Purpose |");
    lines.push("|-----------|---------|");
    for (const dir of info.srcDirs) {
      lines.push(`| \`${dir.name}/\` | ${dir.desc} |`);
    }
    if (info.entryPoints.length > 0) {
      lines.push("");
      lines.push(`**Entry points**: ${info.entryPoints.map(e => `\`${e}\``).join(", ")}`);
    }
  } else {
    lines.push("- `src/` — source code");
  }
  lines.push("");

  // Conventions
  lines.push("## Conventions", "");
  if (info.language) lines.push(`- **Language**: ${info.language}${info.framework ? ` (${info.framework})` : ""}`);
  if (info.naming) lines.push(`- **Naming**: ${info.naming}`);
  if (info.formatter) lines.push(`- **Formatting**: ${info.formatter} — run before committing`);
  if (info.linter) lines.push(`- **Linting**: ${info.linter} — fix all warnings`);
  lines.push("- Follow existing code patterns and naming conventions");
  lines.push("- Prefer strict typing; avoid `any`");
  lines.push("- Keep commits focused and well-described");
  lines.push("");

  // Testing
  lines.push("## Testing", "");
  if (info.testFramework) lines.push(`- **Framework**: ${info.testFramework}`);
  if (info.test) lines.push(`- **Run**: \`${info.test}\``);
  lines.push("- Run tests before committing changes");
  lines.push("- Test files should match source file names (e.g., `foo.test.ts`)");
  if (info.testFrameworks.some(t => t === "Cypress" || t === "Playwright")) {
    lines.push(`- **E2E**: ${info.testFrameworks.filter(t => t === "Cypress" || t === "Playwright").join(", ")}`);
  }
  lines.push("");

  // Guidelines
  lines.push("## Guidelines", "");
  lines.push("- Read existing code before modifying; understand context first");
  lines.push("- Prefer editing existing files over creating new ones");
  lines.push("- Do not introduce security vulnerabilities (SQL injection, XSS, command injection)");
  lines.push("- Never commit secrets, API keys, or credentials");
  lines.push("- Add brief comments for non-obvious logic");
  lines.push("- Keep files focused and concise; extract helpers when files grow large");
  lines.push("- Run lint + tests before every commit");
  lines.push("");

  // Infrastructure
  if (info.hasDocker || info.hasCi) {
    lines.push("## Infrastructure", "");
    if (info.hasDocker) lines.push("- **Docker**: Dockerfile present — use for containerized builds/deployments");
    if (info.hasCi) lines.push("- **CI/CD**: pipeline configured — ensure changes pass CI before merging");
    lines.push("");
  }

  // Memory & Signal System
  lines.push("## Memory & Signal System", "");
  lines.push("File-system based memory for cross-session agent collaboration:", "");
  lines.push("| File/Directory | Purpose |");
  lines.push("|----------------|---------|");
  lines.push("| `MEMORY.md` | Long-term project facts, patterns, preferences |");
  lines.push("| `WIP.md` | Current task handoff between sessions |");
  lines.push("| `DECISIONS.md` | Architecture Decision Records |");
  lines.push("| `signals/active/` | Active task signals (YAML) — pick up open tasks |");
  lines.push("| `signals/observations/` | Environment observations, tech debt notes |");
  lines.push("| `signals/archive/` | Completed signals |");
  lines.push("| `memory/` | Daily session logs (`YYYY-MM-DD.md`) |");
  lines.push("");

  // Agent Work Protocol
  lines.push("## Agent Work Protocol", "");
  lines.push("1. **Session start**: Read `WIP.md` + scan `signals/active/` for open tasks");
  lines.push("2. **During work**: Record decisions in `DECISIONS.md`; create observation signals for new issues");
  lines.push("3. **Session end**: Update `WIP.md` with progress, next steps, blockers; archive completed signals");
  lines.push("4. **Continuous iteration**: After completing a signal, return to `signals/active/` for the next task");
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
    if (info.testFramework) log(`  Tests: ${info.testFramework}`);
    if (info.linter || info.formatter) log(`  Tools: ${[info.linter, info.formatter].filter(Boolean).join(", ")}`);
    if (info.hasDocker) log("  Docker: yes");
    if (info.entryPoints.length > 0) log(`  Entry: ${info.entryPoints.join(", ")}`);
    if (info.description) log(`  Desc: ${info.description.slice(0, 80)}`);
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
