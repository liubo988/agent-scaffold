#!/usr/bin/env node

/**
 * agent-scaffold CLI
 *
 * Usage:
 *   npx agent-scaffold init [target-dir] [--signals] [--slim]
 *   npx agent-scaffold doctor [target-dir]
 *   npx agent-scaffold install-skill
 *   npx agent-scaffold --help
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync, readdirSync } from "node:fs";
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

// Core directories (always created)
const CORE_DIRS = ["memory"];

// Signal directories (only with --signals)
const SIGNAL_DIRS = [
  "signals/active",
  "signals/observations",
  "signals/archive",
];

// --------------- Helpers ---------------

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

function parseFlags(args) {
  const flags = { signals: false, slim: false };
  const positional = [];
  for (const arg of args) {
    if (arg === "--signals") flags.signals = true;
    else if (arg === "--slim") flags.slim = true;
    else positional.push(arg);
  }
  return { flags, positional };
}

// --------------- Templates ---------------

function getMemoryMdTemplate(info) {
  const lines = [
    "# Project Memory",
    "",
    "## IMPORTANT — Every Agent MUST Update This File",
    "",
    "After completing ANY task, you MUST add new facts, patterns, or preferences discovered during your work.",
    "Do NOT leave this file unchanged — even one new fact is valuable for the next agent session.",
    "",
    "- **When to write**: After every task — project facts, user preferences, recurring patterns, important discoveries",
    "- **When to remove**: Outdated info, corrected entries, or duplicates",
    "- **Session logs**: Daily detailed logs go in `memory/YYYY-MM-DD.md`",
    "",
    "## Project Facts",
    "",
  ];

  // Pre-fill detected facts instead of all HTML comments
  const facts = [];
  if (info.language) facts.push(`- Primary language: ${info.language}`);
  if (info.framework) facts.push(`- Framework: ${info.framework}`);
  if (info.install) facts.push(`- Package manager: ${info.install.split(" ")[0]}`);
  if (info.testFramework) facts.push(`- Test framework: ${info.testFramework}`);
  if (info.hasDocker) facts.push("- Deployment: Docker");
  if (info.isMonorepo) facts.push(`- Monorepo: ${info.monorepoType || "yes"} (${info.workspaceNames.join(", ")})`);

  if (facts.length > 0) {
    lines.push(...facts);
  } else {
    lines.push("<!-- No project config detected. Add facts here as you discover them. -->");
  }

  lines.push(
    "",
    "## Learned Patterns",
    "",
    "<!-- Code patterns, gotchas, best practices discovered during sessions -->",
    "",
    "## User Preferences",
    "",
    "<!-- User/team preferences for coding style, workflow, communication -->",
    "",
    "## Known Issues",
    "",
    "<!-- Known issues and workarounds -->",
  );

  return lines.join("\n");
}

const DECISIONS_MD = `# Design Decisions

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

<!-- Add decisions below, newest first -->`;

function getWipMdTemplate(hasSignals) {
  const sessionStart = hasSignals
    ? "1. **Session start**: Read this file + scan `signals/active/` for open tasks"
    : "1. **Session start**: Read this file to understand current progress";
  const sessionEnd = hasSignals
    ? "3. **Session end**: Update ALL fields below so the next agent can continue seamlessly; archive completed signals"
    : "3. **Session end**: Update ALL fields below so the next agent can continue seamlessly";

  return `# Work In Progress

**IMPORTANT**: Every agent MUST update this file before ending a conversation. This is the bridge between sessions.

## Agent Protocol

${sessionStart}
2. **During work**: Update "Completed Steps" at important milestones
${sessionEnd}

<!-- ===== EXAMPLE (delete this block after first real update) =====

## Current Task

**Title**: Add user authentication endpoint
**Status**: in progress
**Started**: 2025-06-01

## Context for Next Session

Working on JWT-based auth. Created middleware in src/auth/middleware.ts.
Stopped because: need to clarify token refresh strategy with team.
Key files: src/auth/middleware.ts:25, src/routes/auth.ts

## Completed Steps

- [x] Created auth middleware with JWT validation
- [x] Added login/register route handlers
- [x] Wrote unit tests for token generation

## Next Steps

- [ ] Implement refresh token logic
- [ ] Add rate limiting to auth endpoints
- [ ] Update API docs

## Blockers

- Need team decision on refresh token expiry (1h vs 24h)

===== END EXAMPLE ===== -->

## Current Task

**Title**:
**Status**: not started
**Branch**: \`main\`

## Context for Next Session



## Completed Steps



## Next Steps



## Blockers

`;
}

const SIGNALS_README = `# Signals — Signal-Driven Agent Collaboration

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
- Observations are long-lived; remove only when resolved`;

const EXAMPLE_TASK_YAML = `id: example-task
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
resolved_at: ""`;

const EXAMPLE_OBS_YAML = `id: example-observation
type: observation
author: agent
created: 2026-01-01T00:00:00Z
priority: low
status: open
tags: [example]
context: |
  This is an example observation signal. Replace or delete this file.
  Agents create observations when they notice issues, patterns, or tech debt.
  Observations don't need to be claimed — they are passive knowledge.`;

// --------------- Project Detection ---------------

function detectProject(target) {
  const info = {
    name: basename(target),
    description: "",
    languages: [],
    framework: null,
    frameworks: [],
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
    testFrameworks: [],
    naming: null,
    srcDirs: [],
    hasDocker: false,
    hasCi: false,
    hasReadme: false,
    entryPoints: [],
    configFiles: [],
    // Monorepo fields
    isMonorepo: false,
    monorepoType: null,
    workspaceNames: [],
    workspacePackages: [],
  };

  // --- Read root package.json ---
  const pkgPath = join(target, "package.json");
  let pkg = null;
  if (existsSync(pkgPath)) {
    try { pkg = JSON.parse(readFileSync(pkgPath, "utf8")); } catch { /* ignore */ }
  }
  if (pkg?.description) {
    info.description = pkg.description;
  }

  // --- Detect monorepo ---
  detectMonorepo(target, info, pkg);

  // --- Read project description from other sources ---
  const setupPyPath = join(target, "setup.py");
  if (!info.description && existsSync(setupPyPath)) {
    try {
      const content = readFileSync(setupPyPath, "utf8");
      const m = content.match(/description\s*=\s*["']([^"']+)["']/);
      if (m) info.description = m[1];
    } catch { /* ignore */ }
  }

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
            if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("[!") || trimmed.startsWith("![") || trimmed.startsWith("---") || trimmed.startsWith("<")) continue;
            info.description = trimmed.slice(0, 200);
            break;
          }
        } catch { /* ignore */ }
      }
      break;
    }
  }

  // --- Detect source directories ---
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
  for (const dir of ["tests", "test", "__tests__", "cypress", "e2e"]) {
    if (existsSync(join(target, dir))) {
      info.srcDirs.push({ name: dir, desc: "tests" });
      break;
    }
  }
  if (existsSync(join(target, "docs"))) info.srcDirs.push({ name: "docs", desc: "documentation" });

  // --- For monorepos, add workspace dirs with richer descriptions ---
  if (info.isMonorepo && info.workspacePackages.length > 0) {
    for (const wp of info.workspacePackages) {
      const existing = info.srcDirs.find(d => d.name === wp.dir);
      if (existing) {
        // Enrich existing entry with framework info
        if (wp.frameworks.length > 0) {
          existing.desc = `${wp.frameworks.join(" + ")} ${existing.desc}`;
        }
      } else {
        const desc = wp.frameworks.length > 0
          ? `${wp.frameworks.join(" + ")} workspace`
          : "workspace package";
        info.srcDirs.push({ name: wp.dir, desc });
      }
    }
  }

  // --- Detect Docker, CI, config files ---
  info.hasDocker = ["Dockerfile", "docker-compose.yml", "docker-compose.yaml"].some(f => existsSync(join(target, f)));
  // Also check for Dockerfile-* patterns (e.g., Dockerfile-frontend, Dockerfile-backend)
  try {
    const rootFiles = readdirSync(target);
    if (rootFiles.some(f => f.startsWith("Dockerfile"))) info.hasDocker = true;
  } catch { /* ignore */ }

  info.hasCi = [".github/workflows", ".gitlab-ci.yml", "Jenkinsfile", ".circleci"].some(f => existsSync(join(target, f)));

  for (const f of [".env.example", ".editorconfig", "tsconfig.json", "pyproject.toml", "Cargo.toml", "go.mod", ".eslintrc.js", ".eslintrc.json", "biome.json", "ruff.toml"]) {
    if (existsSync(join(target, f))) info.configFiles.push(f);
  }

  for (const f of ["main.py", "app.py", "server.py", "index.ts", "index.js", "main.ts", "main.go", "main.rs", "src/main.rs", "src/lib.rs"]) {
    if (existsSync(join(target, f))) info.entryPoints.push(f);
  }

  // --- Detect from root package.json ---
  if (pkg) {
    detectNodePackage(target, info, pkg);
  }

  // --- For monorepos without root deps, merge from workspace packages ---
  if (info.isMonorepo && info.languages.length === 0) {
    for (const wp of info.workspacePackages) {
      for (const lang of wp.languages) {
        if (!info.languages.includes(lang)) info.languages.push(lang);
      }
      for (const fw of wp.frameworks) {
        if (!info.frameworks.includes(fw)) info.frameworks.push(fw);
      }
      for (const tf of wp.testFrameworks) {
        if (!info.testFrameworks.includes(tf)) info.testFrameworks.push(tf);
      }
      if (wp.linter && !info.linter) info.linter = wp.linter;
      if (wp.formatter && !info.formatter) info.formatter = wp.formatter;
    }

    // Detect package manager from lockfiles
    if (!info.install) {
      if (existsSync(join(target, "pnpm-lock.yaml"))) info.install = "pnpm install";
      else if (existsSync(join(target, "bun.lockb")) || existsSync(join(target, "bun.lock"))) info.install = "bun install";
      else if (existsSync(join(target, "yarn.lock"))) info.install = "yarn install";
      else if (existsSync(join(target, "package-lock.json"))) info.install = "npm install";
    }

    // For monorepos, generate per-workspace commands
    if (!info.build && !info.dev && !info.test) {
      const pm = info.install ? info.install.split(" ")[0] : "npm";
      for (const wp of info.workspacePackages) {
        if (wp.scripts.build && !info.build) info.build = `cd ${wp.dir} && ${pm} run build`;
        if (wp.scripts.dev && !info.dev) info.dev = `cd ${wp.dir} && ${pm} run dev`;
        if (wp.scripts.test && !info.test) info.test = `cd ${wp.dir} && ${pm} test`;
        if (wp.scripts.lint && !info.lint) info.lint = `cd ${wp.dir} && ${pm} run lint`;
        if (wp.scripts.format && !info.format) info.format = `cd ${wp.dir} && ${pm} run format`;
        if ((wp.scripts.typecheck || wp.scripts["type-check"]) && !info.typecheck) {
          info.typecheck = `cd ${wp.dir} && ${pm} run ${wp.scripts.typecheck ? "typecheck" : "type-check"}`;
        }
      }
    }
  }

  // --- Python ---
  const pyprojectPath = join(target, "pyproject.toml");
  const requirementsPath = join(target, "requirements.txt");
  if (existsSync(pyprojectPath) || existsSync(requirementsPath) || existsSync(setupPyPath)) {
    if (!info.languages.includes("Python")) info.languages.push("Python");
    info.naming = info.naming || "snake_case for functions/variables, PascalCase for classes";

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

  // Deduplicate
  info.frameworks = [...new Set(info.frameworks)];
  info.testFrameworks = [...new Set(info.testFrameworks)];

  // Set primary language/framework for backward compat
  if (info.languages.length > 0) info.language = info.languages.join(" + ");
  if (info.frameworks.length > 0) info.framework = info.frameworks.join(" + ");
  if (info.testFrameworks.length > 0) info.testFramework = info.testFrameworks.join(" + ");
  if (!info.naming && info.languages.length > 0) info.naming = "follow existing project conventions";

  return info;
}

// --------------- Monorepo Detection ---------------

function detectMonorepo(target, info, rootPkg) {
  // Check pnpm-workspace.yaml
  const pnpmWsPath = join(target, "pnpm-workspace.yaml");
  if (existsSync(pnpmWsPath)) {
    info.isMonorepo = true;
    info.monorepoType = "pnpm workspaces";
  }

  // Check lerna.json
  if (existsSync(join(target, "lerna.json"))) {
    info.isMonorepo = true;
    info.monorepoType = info.monorepoType || "Lerna";
  }

  // Check package.json workspaces
  if (rootPkg?.workspaces) {
    info.isMonorepo = true;
    info.monorepoType = info.monorepoType || "npm workspaces";
  }

  // If no explicit monorepo config, check if subdirs have package.json (heuristic)
  if (!info.isMonorepo && !rootPkg) {
    try {
      const entries = readdirSync(target, { withFileTypes: true });
      const subPkgs = entries
        .filter(e => e.isDirectory() && !e.name.startsWith(".") && !e.name.startsWith("node_modules"))
        .filter(e => existsSync(join(target, e.name, "package.json")));
      if (subPkgs.length >= 2) {
        info.isMonorepo = true;
        info.monorepoType = "multi-package";
      }
    } catch { /* ignore */ }
  }

  // If monorepo detected, scan workspace packages
  if (info.isMonorepo) {
    scanWorkspacePackages(target, info);
  }
}

function scanWorkspacePackages(target, info) {
  try {
    const entries = readdirSync(target, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "node_modules") continue;

      const subPkgPath = join(target, entry.name, "package.json");
      if (!existsSync(subPkgPath)) continue;

      let subPkg;
      try { subPkg = JSON.parse(readFileSync(subPkgPath, "utf8")); } catch { continue; }

      const wp = {
        dir: entry.name,
        name: subPkg.name || entry.name,
        languages: [],
        frameworks: [],
        testFrameworks: [],
        linter: null,
        formatter: null,
        scripts: subPkg.scripts || {},
      };

      const deps = { ...subPkg.dependencies, ...subPkg.devDependencies };

      // Language
      if (deps.typescript || existsSync(join(target, entry.name, "tsconfig.json"))) {
        wp.languages.push("TypeScript");
      } else {
        wp.languages.push("JavaScript");
      }

      // Frameworks
      if (deps.next) wp.frameworks.push("Next.js");
      if (deps.nuxt) wp.frameworks.push("Nuxt");
      if (deps.react && !deps.next) wp.frameworks.push("React");
      if (deps.vue && !deps.nuxt) wp.frameworks.push("Vue");
      if (deps.svelte || deps["@sveltejs/kit"]) wp.frameworks.push("SvelteKit");
      if (deps.express) wp.frameworks.push("Express");
      if (deps.fastify) wp.frameworks.push("Fastify");
      if (deps.nest || deps["@nestjs/core"]) wp.frameworks.push("NestJS");
      if (deps.electron) wp.frameworks.push("Electron");

      // Test frameworks
      if (deps.vitest) wp.testFrameworks.push("Vitest");
      if (deps.jest) wp.testFrameworks.push("Jest");
      if (deps.mocha) wp.testFrameworks.push("Mocha");
      if (deps.cypress) wp.testFrameworks.push("Cypress");
      if (deps.playwright || deps["@playwright/test"]) wp.testFrameworks.push("Playwright");

      // Linter/Formatter
      if (deps.oxlint) wp.linter = "Oxlint";
      else if (deps.eslint) wp.linter = "ESLint";
      else if (deps.biome || deps["@biomejs/biome"]) { wp.linter = "Biome"; wp.formatter = "Biome"; }
      if (!wp.formatter) {
        if (deps.prettier) wp.formatter = "Prettier";
      }

      info.workspaceNames.push(entry.name);
      info.workspacePackages.push(wp);
    }
  } catch { /* ignore */ }
}

function detectNodePackage(target, info, pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const scripts = pkg.scripts || {};

  // Language
  if (deps.typescript || existsSync(join(target, "tsconfig.json"))) {
    if (!info.languages.includes("TypeScript")) info.languages.push("TypeScript");
  } else {
    if (!info.languages.includes("JavaScript") && !info.languages.includes("TypeScript")) info.languages.push("JavaScript");
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
  if (!info.install) {
    if (existsSync(join(target, "pnpm-lock.yaml"))) info.install = "pnpm install";
    else if (existsSync(join(target, "bun.lockb")) || existsSync(join(target, "bun.lock"))) info.install = "bun install";
    else if (existsSync(join(target, "yarn.lock"))) info.install = "yarn install";
    else info.install = "npm install";
  }
  const pm = info.install.split(" ")[0];

  // Scripts detection
  if (scripts.build && !info.build) info.build = `${pm} run build`;
  if (scripts.dev && !info.dev) info.dev = `${pm} run dev`;
  else if (scripts.start && !info.dev) info.dev = `${pm} start`;
  if (scripts.test && !info.test) info.test = `${pm} test`;
  if (scripts.lint && !info.lint) info.lint = `${pm} run lint`;
  if (scripts.format && !info.format) info.format = `${pm} run format`;
  if ((scripts.typecheck || scripts["type-check"]) && !info.typecheck) info.typecheck = `${pm} run typecheck`;

  // Test framework
  if (deps.vitest) info.testFrameworks.push("Vitest");
  if (deps.jest) info.testFrameworks.push("Jest");
  if (deps.mocha) info.testFrameworks.push("Mocha");

  // Linter / Formatter
  if (!info.linter) {
    if (deps.oxlint) info.linter = "Oxlint";
    else if (deps.eslint) info.linter = "ESLint";
    else if (deps.biome || deps["@biomejs/biome"]) { info.linter = "Biome"; info.formatter = "Biome"; }
  }
  if (!info.formatter) {
    if (deps.prettier) info.formatter = "Prettier";
    else if (deps.oxfmt) info.formatter = "Oxfmt";
  }
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

// --------------- Framework-Specific Footgun Rules ---------------

function getFrameworkFootguns(frameworks, info) {
  const rules = [];
  for (const fw of frameworks) {
    switch (fw) {
      case "Vue":
      case "Nuxt":
        rules.push("- **Vue reactivity**: never destructure `reactive()` return values — loses reactivity. Use `toRefs()` or access properties directly");
        rules.push("- **Vue props**: use `defineProps<T>()` with TypeScript generics, not runtime `props: {}` declaration");
        rules.push("- **Vue computed**: prefer `computed()` over methods for derived state — caches automatically");
        rules.push("- **Vue watchers**: avoid `watch()` on entire reactive objects without `{ deep: true }`; prefer watching specific refs");
        rules.push("- **Vue async setup**: if using `<script setup>` with top-level `await`, the component becomes async — must wrap in `<Suspense>`");
        break;
      case "React":
        rules.push("- **React hooks**: never call hooks conditionally or inside loops — violates Rules of Hooks");
        rules.push("- **React state**: `setState` is asynchronous; don't read state right after setting it");
        rules.push("- **React effects**: always include dependencies in `useEffect` dependency array; missing deps cause stale closures");
        rules.push("- **React keys**: never use array index as `key` for lists that reorder — causes state bugs");
        break;
      case "Next.js":
        rules.push("- **Next.js**: `'use client'` directive must be at the top of the file, before any imports");
        rules.push("- **Next.js**: Server Components cannot use hooks, browser APIs, or event handlers");
        rules.push("- **Next.js**: `fetch()` in Server Components is cached by default — use `{ cache: 'no-store' }` for dynamic data");
        rules.push("- **Next.js**: `redirect()` throws internally — don't wrap in try/catch");
        break;
      case "Express":
        rules.push("- **Express 5**: async route handlers propagate errors automatically — no need for try/catch wrapper unless custom error response needed");
        rules.push("- **Express middleware**: `next()` does not stop execution — always `return next()` or use `return res.json()`");
        rules.push("- **Express ordering**: middleware order matters: body parser → auth → validation → route handler → error handler (4-arg function)");
        rules.push("- **Express error handler**: error middleware MUST have 4 parameters `(err, req, res, next)` or Express won't recognize it");
        break;
      case "Fastify":
        rules.push("- **Fastify**: use JSON Schema for request/response validation; Fastify serializes responses — don't call `JSON.stringify()` manually");
        rules.push("- **Fastify decorators**: add decorators in plugin registration, not at runtime — they are frozen after `ready`");
        break;
      case "NestJS":
        rules.push("- **NestJS DI**: decorators like `@Injectable()` are required — missing them causes DI resolution failures");
        rules.push("- **NestJS guards**: guards run before interceptors and pipes — order matters for auth + validation");
        break;
      case "Django":
        rules.push("- **Django ORM**: `filter()` returns a lazy QuerySet — chain `.all()` or iterate to execute. Avoid `.get()` without try/except");
        rules.push("- **Django migrations**: never manually edit migration files — use `makemigrations` to regenerate");
        rules.push("- **Django settings**: `DEBUG=True` in production leaks source code in error pages");
        break;
      case "FastAPI":
        rules.push("- **FastAPI**: `Depends()` runs per-request — don't use it for expensive one-time initialization");
        rules.push("- **FastAPI Pydantic**: `Optional[str]` is not the same as `str = None` in Pydantic v2 — use `str | None = None`");
        rules.push("- **FastAPI async**: mixing sync/async incorrectly blocks the event loop — use `async def` for I/O, plain `def` for CPU");
        break;
      case "Flask":
        rules.push("- **Flask**: `g` and `request` are thread-local proxies — don't pass them to background threads");
        rules.push("- **Flask**: `app.run(debug=True)` uses the reloader — spawns two processes which confuses debuggers");
        break;
      case "SvelteKit":
        rules.push("- **SvelteKit**: `$state` rune creates reactive state — don't use `let` for reactive variables in Svelte 5");
        rules.push("- **SvelteKit**: server-only code in `+page.server.ts` — importing server modules in `+page.svelte` leaks to client");
        break;
    }
  }

  // Package manager specific
  if (info.isMonorepo && info.monorepoType) {
    if (info.monorepoType.includes("pnpm")) {
      rules.push("- **pnpm workspace**: use `pnpm -F <package> add <dep>` to add deps to a specific workspace");
      rules.push("- **pnpm workspace**: never use `workspace:*` in `dependencies` — breaks `npm install` for consumers. Use in `devDependencies` only");
      rules.push("- **pnpm workspace**: run scripts in workspace: `pnpm -F <package> run <script>`");
    } else if (info.monorepoType.includes("npm")) {
      rules.push("- **npm workspace**: use `npm -w <package> run <script>` to run scripts in a specific workspace");
    }
  }

  return rules;
}

// --------------- Multi-Agent Safety Rules ---------------

const MULTI_AGENT_SAFETY = `## Multi-Agent Safety

When multiple agents (or agent sessions) work on the same codebase:

- Do not create, apply, or drop \`git stash\` entries unless explicitly requested
- When committing, scope to your own changes only — do not stage unrecognized files
- Do not switch branches or check out a different branch unless explicitly requested
- Do not create, remove, or modify \`git worktree\` checkouts unless explicitly requested
- When pushing, \`git pull --rebase\` first to integrate others' work — never discard
- When you see unrecognized files in the working tree, leave them alone and keep going
- Focus reports on your own edits; avoid disclaimers about other agents' work`;

// --------------- Generate .claude/settings.json ---------------

function generateClaudeSettings(info) {
  const allow = [];

  // Add detected tool commands
  if (info.test) allow.push(`Bash(${info.test})`);
  if (info.lint) allow.push(`Bash(${info.lint})`);
  if (info.build) allow.push(`Bash(${info.build})`);
  if (info.typecheck) allow.push(`Bash(${info.typecheck})`);
  if (info.format) allow.push(`Bash(${info.format})`);

  // Add workspace commands for monorepos
  if (info.isMonorepo && info.workspacePackages.length > 0) {
    const pm = info.install ? info.install.split(" ")[0] : "npm";
    for (const wp of info.workspacePackages) {
      if (wp.scripts.test) allow.push(`Bash(cd ${wp.dir} && ${pm} test)`);
      if (wp.scripts.lint) allow.push(`Bash(cd ${wp.dir} && ${pm} run lint)`);
      if (wp.scripts.build) allow.push(`Bash(cd ${wp.dir} && ${pm} run build)`);
    }
  }

  // Common read-only tools
  allow.push("Read", "Glob", "Grep");

  // Deduplicate
  const uniqueAllow = [...new Set(allow)];

  return JSON.stringify({ permissions: { allow: uniqueAllow } }, null, 2);
}

// --------------- Generate CLAUDE.md ---------------

function generateClaudeMd(info, hasSignals) {
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
    if (info.isMonorepo) parts.push(`Monorepo (${info.monorepoType})`);
    lines.push(parts.join(" | "), "");
  }

  // REQUIRED: Memory Updates (placed at top for high visibility)
  lines.push("## REQUIRED: Update Memory After Every Task", "");
  lines.push("After completing ANY task, you MUST update these files before ending the conversation:", "");
  lines.push("1. **`WIP.md`** — Record what was done, current status, next steps, and blockers");
  lines.push("2. **`MEMORY.md`** — Add any new project facts, patterns, or preferences discovered");
  lines.push("3. **`DECISIONS.md`** — Record any architecture or design decisions made (if applicable)", "");
  lines.push("This is NOT optional. Even for small tasks, update at minimum `WIP.md` with a one-line summary.", "");

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

  // Monorepo workspace commands
  if (info.isMonorepo && info.workspacePackages.length > 0) {
    const pm = info.install ? info.install.split(" ")[0] : "npm";
    lines.push("### Workspace Commands", "");
    lines.push("```bash");
    for (const wp of info.workspacePackages) {
      const scripts = wp.scripts;
      const wpCmds = [];
      if (scripts.dev) wpCmds.push(`cd ${wp.dir} && ${pm} run dev`);
      if (scripts.build) wpCmds.push(`cd ${wp.dir} && ${pm} run build`);
      if (scripts.test) wpCmds.push(`cd ${wp.dir} && ${pm} test`);
      if (scripts.lint) wpCmds.push(`cd ${wp.dir} && ${pm} run lint`);
      if (wpCmds.length > 0) {
        lines.push(`# ${wp.dir} (${wp.frameworks.join(" + ") || wp.languages.join(" + ")})`);
        for (const c of wpCmds) lines.push(c);
        lines.push("");
      }
    }
    lines.push("```", "");
  }

  // Code Style
  lines.push("## Code Style & Conventions", "");
  if (info.language) lines.push(`- **Language**: ${info.language}`);
  if (info.formatter) lines.push(`- **Formatter**: ${info.formatter}${info.format ? ` — run \`${info.format}\` before committing` : ""}`);
  if (info.linter) lines.push(`- **Linter**: ${info.linter}${info.lint ? ` — run \`${info.lint}\`` : ""}`);
  if (info.naming) lines.push(`- **Naming**: ${info.naming}`);
  if (info.languages.includes("TypeScript")) {
    lines.push("- Prefer strict typing; avoid `any`");
  } else if (info.languages.includes("Python")) {
    lines.push("- Use type hints; avoid `Any` — prefer explicit types");
  }
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

  // Framework-specific footguns
  if (info.frameworks.length > 0) {
    const footguns = getFrameworkFootguns(info.frameworks, info);
    if (footguns.length > 0) {
      lines.push("## Known Pitfalls", "");
      lines.push("Framework-specific gotchas — violating these causes subtle bugs:", "");
      lines.push(...footguns);
      lines.push("");
    }
  }

  // Known Footguns placeholder (for project-specific issues to accumulate)
  lines.push("## Known Footguns", "");
  lines.push("<!-- Record project-specific pitfalls discovered during development.");
  lines.push("   Each entry: what went wrong, why, and how to avoid it. Example:");
  lines.push("   - GitHub comment escaping: use heredoc for bodies with backticks");
  lines.push("   - API rate limit: batch requests to /api/search, max 10/min -->");
  lines.push("");

  // Testing
  lines.push("## Testing", "");
  if (info.testFramework) lines.push(`- **Framework**: ${info.testFramework}`);
  if (info.test) lines.push(`- **Run**: \`${info.test}\``);
  lines.push("- Run tests before pushing when you touch logic");
  if (info.languages.includes("Python")) {
    lines.push("- Test files in `tests/` directory (e.g. `test_foo.py` for `foo.py`)");
  } else {
    lines.push("- Test files colocated with source (e.g. `foo.test.ts` next to `foo.ts`) or in `tests/` directory");
  }
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

  // Memory system
  lines.push("## Memory System", "");
  lines.push("This project uses file-system based memory for cross-session AI agent collaboration:", "");
  lines.push("- `MEMORY.md` — Long-term project facts, patterns, and preferences");
  lines.push("- `WIP.md` — Current task handoff (read at session start, update at session end)");
  lines.push("- `DECISIONS.md` — Architecture Decision Records");
  lines.push("- `memory/` — Daily session logs (`YYYY-MM-DD.md`)");
  if (hasSignals) {
    lines.push("- `signals/active/` — Active task signals (YAML); pick up open tasks here");
    lines.push("- `signals/observations/` — Environment observations and tech debt notes");
  }
  lines.push("");

  // Agent Work Protocol
  lines.push("## Agent Work Protocol", "");
  lines.push("1. **Session start**: Read `WIP.md` and `MEMORY.md` to understand current state");
  if (hasSignals) {
    lines.push("2. **Pick up work**: Scan `signals/active/` for open tasks; claim one by updating its YAML");
  }
  lines.push(`${hasSignals ? "3" : "2"}. **During work**: Record decisions in \`DECISIONS.md\`; update \`WIP.md\` at milestones`);
  lines.push(`${hasSignals ? "4" : "3"}. **BEFORE ending conversation (MANDATORY)**:`);
  lines.push("   - Update `WIP.md` — what was done, status, next steps, blockers");
  lines.push("   - Update `MEMORY.md` — any new facts, patterns, or preferences discovered");
  lines.push("   - If any design decisions were made, add entry to `DECISIONS.md`");
  if (hasSignals) {
    lines.push(`5. **Continuous iteration**: Archive completed signals; check \`signals/active/\` for the next task`);
  }
  lines.push("");

  // Multi-Agent Safety
  lines.push(MULTI_AGENT_SAFETY, "");

  // Commit
  lines.push("## Commit Guidelines", "");
  lines.push("- Write concise, action-oriented commit messages (e.g. `feat: add user auth`, `fix: null pointer in parser`)");
  lines.push("- Group related changes; avoid bundling unrelated refactors");
  lines.push("- Run lint and tests before committing");
  lines.push("");

  return lines.join("\n");
}

// --------------- Generate AGENTS.md ---------------

function generateAgentsMd(info, hasSignals) {
  const lines = ["# AGENTS.md", ""];

  // Project overview
  lines.push("## Project", "");
  if (info.description) {
    lines.push(info.description, "");
  } else {
    lines.push(`<!-- TODO: Add a one-line description of ${info.name} -->`, "");
  }
  if (info.language) {
    const stackParts = [info.language];
    if (info.framework) stackParts.push(info.framework);
    if (info.isMonorepo) stackParts.push(`Monorepo (${info.monorepoType})`);
    lines.push(`**Tech Stack**: ${stackParts.join(" / ")}`, "");
  }

  // REQUIRED: Memory Updates (placed at top for high visibility)
  lines.push("## REQUIRED: Update Memory After Every Task", "");
  lines.push("After completing ANY task, you MUST update these files before ending the conversation:", "");
  lines.push("1. **`WIP.md`** — Record what was done, current status, next steps, and blockers");
  lines.push("2. **`MEMORY.md`** — Add any new project facts, patterns, or preferences discovered");
  lines.push("3. **`DECISIONS.md`** — Record any architecture or design decisions made (if applicable)", "");
  lines.push("This is NOT optional. Even for small tasks, update at minimum `WIP.md` with a one-line summary.", "");

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

  // Monorepo workspace commands
  if (info.isMonorepo && info.workspacePackages.length > 0) {
    const pm = info.install ? info.install.split(" ")[0] : "npm";
    lines.push("### Workspace Commands", "");
    for (const wp of info.workspacePackages) {
      const scripts = wp.scripts;
      const wpCmds = [];
      if (scripts.dev) wpCmds.push(`cd ${wp.dir} && ${pm} run dev`);
      if (scripts.build) wpCmds.push(`cd ${wp.dir} && ${pm} run build`);
      if (scripts.test) wpCmds.push(`cd ${wp.dir} && ${pm} test`);
      if (wpCmds.length > 0) {
        lines.push(`**${wp.dir}** (${wp.frameworks.join(", ") || wp.languages.join(", ")}): \`${wpCmds[0]}\``);
      }
    }
    lines.push("");
  }

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

  // Known Pitfalls (framework-specific)
  if (info.frameworks.length > 0) {
    const footguns = getFrameworkFootguns(info.frameworks, info);
    if (footguns.length > 0) {
      lines.push("## Known Pitfalls", "");
      lines.push(...footguns);
      lines.push("");
    }
  }

  // Infrastructure
  if (info.hasDocker || info.hasCi) {
    lines.push("## Infrastructure", "");
    if (info.hasDocker) lines.push("- **Docker**: Dockerfile present — use for containerized builds/deployments");
    if (info.hasCi) lines.push("- **CI/CD**: pipeline configured — ensure changes pass CI before merging");
    lines.push("");
  }

  // Multi-Agent Safety
  lines.push(MULTI_AGENT_SAFETY, "");

  // Memory system
  lines.push("## Memory System", "");
  lines.push("File-system based memory for cross-session agent collaboration:", "");
  lines.push("| File/Directory | Purpose |");
  lines.push("|----------------|---------|");
  lines.push("| `MEMORY.md` | Long-term project facts, patterns, preferences |");
  lines.push("| `WIP.md` | Current task handoff between sessions |");
  lines.push("| `DECISIONS.md` | Architecture Decision Records |");
  lines.push("| `memory/` | Daily session logs (`YYYY-MM-DD.md`) |");
  if (hasSignals) {
    lines.push("| `signals/active/` | Active task signals (YAML) — pick up open tasks |");
    lines.push("| `signals/observations/` | Environment observations, tech debt notes |");
    lines.push("| `signals/archive/` | Completed signals |");
  }
  lines.push("");

  // Agent Work Protocol
  lines.push("## Agent Work Protocol", "");
  lines.push("1. **Session start**: Read `WIP.md` and `MEMORY.md` to understand current state");
  if (hasSignals) {
    lines.push("2. **Pick up work**: Scan `signals/active/` for open tasks");
  }
  lines.push(`${hasSignals ? "3" : "2"}. **During work**: Record decisions in \`DECISIONS.md\`; update \`WIP.md\` at milestones`);
  lines.push(`${hasSignals ? "4" : "3"}. **BEFORE ending conversation (MANDATORY)**:`);
  lines.push("   - Update `WIP.md` — what was done, status, next steps, blockers");
  lines.push("   - Update `MEMORY.md` — any new facts, patterns, or preferences discovered");
  lines.push("   - If any design decisions were made, add entry to `DECISIONS.md`");
  if (hasSignals) {
    lines.push(`5. **Continuous iteration**: Archive completed signals; return to \`signals/active/\` for the next task`);
  }
  lines.push("");

  return lines.join("\n");
}

// --------------- Commands ---------------

function cmdInit(targetDir, flags) {
  const target = resolve(targetDir || process.cwd());
  const hasSignals = flags.signals;
  const isSlim = flags.slim;

  if (!existsSync(target)) {
    err(`Directory not found: ${target}`);
  }

  log(`Initializing scaffold in: ${target}`);
  if (hasSignals) log("  Signal system: enabled (--signals)");
  if (isSlim) log("  Slim mode: enabled (--slim)");
  console.log();

  let created = 0;
  let skipped = 0;

  // Step 1: Detect project
  const info = detectProject(target);
  if (info.language) {
    log(`Detected: ${info.language}${info.framework ? ` + ${info.framework}` : ""}`);
    if (info.isMonorepo) log(`  Monorepo: ${info.monorepoType} (${info.workspaceNames.join(", ")})`);
    if (info.testFramework) log(`  Tests: ${info.testFramework}`);
    if (info.linter || info.formatter) log(`  Tools: ${[...new Set([info.linter, info.formatter].filter(Boolean))].join(", ")}`);
    if (info.hasDocker) log("  Docker: yes");
    if (info.entryPoints.length > 0) log(`  Entry: ${info.entryPoints.join(", ")}`);
    if (info.description) log(`  Desc: ${info.description.slice(0, 80)}`);
  } else {
    log("No known project config found — using generic templates");
  }
  console.log();

  // Step 2: Generate CLAUDE.md
  const claudeMdContent = generateClaudeMd(info, hasSignals);
  if (createIfMissing(join(target, "CLAUDE.md"), claudeMdContent)) {
    created++;
  } else {
    skipped++;
  }

  // Step 3: Generate AGENTS.md
  const agentsMdContent = generateAgentsMd(info, hasSignals);
  if (createIfMissing(join(target, "AGENTS.md"), agentsMdContent)) {
    created++;
  } else {
    skipped++;
  }

  // Step 3b: Generate .claude/settings.json (project-level permissions)
  if (info.test || info.lint || info.build) {
    const claudeSettingsPath = join(target, ".claude", "settings.json");
    if (createIfMissing(claudeSettingsPath, generateClaudeSettings(info))) {
      created++;
    } else {
      skipped++;
    }
  }

  if (!isSlim) {
    // Step 4: Create core directories
    for (const dir of CORE_DIRS) {
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

    // Step 4b: Create signal directories (only with --signals)
    if (hasSignals) {
      for (const dir of SIGNAL_DIRS) {
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
    }

    // Step 5: Create template files
    // MEMORY.md (dynamic, based on detected info)
    if (createIfMissing(join(target, "MEMORY.md"), getMemoryMdTemplate(info))) {
      created++;
    } else {
      skipped++;
    }

    // DECISIONS.md
    if (createIfMissing(join(target, "DECISIONS.md"), DECISIONS_MD)) {
      created++;
    } else {
      skipped++;
    }

    // WIP.md
    if (createIfMissing(join(target, "WIP.md"), getWipMdTemplate(hasSignals))) {
      created++;
    } else {
      skipped++;
    }

    // Signal templates (only with --signals)
    if (hasSignals) {
      if (createIfMissing(join(target, "signals/README.md"), SIGNALS_README)) created++; else skipped++;
      if (createIfMissing(join(target, "signals/active/_example-task.yaml"), EXAMPLE_TASK_YAML)) created++; else skipped++;
      if (createIfMissing(join(target, "signals/observations/_example-observation.yaml"), EXAMPLE_OBS_YAML)) created++; else skipped++;
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
  if (!hasSignals) {
    log("");
    log("Tip: Run with --signals to enable the signal-driven task coordination system");
  }
}

// --------------- Doctor Command ---------------

function cmdDoctor(targetDir) {
  const target = resolve(targetDir || process.cwd());
  log(`Checking scaffold health in: ${target}`);
  console.log();

  let ok = 0;
  let warn = 0;
  let fail = 0;

  function check(label, condition, warnOnly = false) {
    if (condition) {
      console.log(`  ✅ ${label}`);
      ok++;
    } else if (warnOnly) {
      console.log(`  ⚠️  ${label}`);
      warn++;
    } else {
      console.log(`  ❌ ${label}`);
      fail++;
    }
  }

  // Core files
  console.log("Core files:");
  check("CLAUDE.md exists", existsSync(join(target, "CLAUDE.md")));
  check("AGENTS.md exists", existsSync(join(target, "AGENTS.md")));

  // Check CLAUDE.md is not empty / has real content
  if (existsSync(join(target, "CLAUDE.md"))) {
    const content = readFileSync(join(target, "CLAUDE.md"), "utf8");
    check("CLAUDE.md has content (> 100 chars)", content.length > 100);
    check("CLAUDE.md has build commands", content.includes("```bash") && !content.includes("```bash\n```"), true);
  }

  console.log("\nMemory system:");
  check("MEMORY.md exists", existsSync(join(target, "MEMORY.md")));
  check("WIP.md exists", existsSync(join(target, "WIP.md")));
  check("DECISIONS.md exists", existsSync(join(target, "DECISIONS.md")));
  check("memory/ directory exists", existsSync(join(target, "memory")), true);

  // Signal system (optional)
  const hasSignals = existsSync(join(target, "signals"));
  if (hasSignals) {
    console.log("\nSignal system:");
    check("signals/active/ exists", existsSync(join(target, "signals/active")));
    check("signals/observations/ exists", existsSync(join(target, "signals/observations")));
    check("signals/archive/ exists", existsSync(join(target, "signals/archive")));
    check("signals/README.md exists", existsSync(join(target, "signals/README.md")), true);
  }

  // Claude Code integration
  console.log("\nClaude Code integration:");
  check(".claude/settings.json exists", existsSync(join(target, ".claude/settings.json")), true);
  if (existsSync(join(target, ".claude/settings.json"))) {
    try {
      JSON.parse(readFileSync(join(target, ".claude/settings.json"), "utf8"));
      check(".claude/settings.json is valid JSON", true);
    } catch {
      check(".claude/settings.json is valid JSON", false);
    }
  }

  // Quality checks
  console.log("\nContent quality:");
  if (existsSync(join(target, "CLAUDE.md"))) {
    const content = readFileSync(join(target, "CLAUDE.md"), "utf8");
    check("CLAUDE.md has Multi-Agent Safety section", content.includes("Multi-Agent Safety"), true);
    check("CLAUDE.md has Known Pitfalls or Footguns section", content.includes("Known Pitfalls") || content.includes("Known Footguns"), true);
  }

  // .gitignore
  console.log("\nGit integration:");
  if (existsSync(join(target, ".gitignore"))) {
    const gi = readFileSync(join(target, ".gitignore"), "utf8");
    check(".gitignore has scaffold rules", gi.includes(MARKER));
  } else {
    check(".gitignore exists", false, true);
  }

  // Git repo
  check("Inside a git repository", existsSync(join(target, ".git")), true);

  console.log();
  log(`Health check: ${ok} passed, ${warn} warnings, ${fail} failed`);
  if (fail > 0) {
    log("Run `npx agent-scaffold init` to fix missing files.");
  } else if (warn > 0) {
    log("All critical checks passed. Warnings are optional improvements.");
  } else {
    log("Scaffold is healthy!");
  }
}

// --------------- Install Skill ---------------

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

// --------------- Help ---------------

function showHelp() {
  console.log(`
agent-scaffold — AI agent collaboration infrastructure initializer

Usage:
  agent-scaffold init [dir] [options]    Initialize scaffold (default: current directory)
  agent-scaffold doctor [dir]            Check scaffold health
  agent-scaffold install-skill           Install as Claude Code global skill
  agent-scaffold --help                  Show this help

Options:
  --signals    Enable signal-driven task coordination system (signals/ directory)
  --slim       Minimal output: only CLAUDE.md + AGENTS.md + .gitignore

Examples:
  npx agent-scaffold init                      # Scaffold current directory
  npx agent-scaffold init ./my-project         # Scaffold a specific directory
  npx agent-scaffold init --signals            # Include signal system
  npx agent-scaffold init --slim               # Minimal: just CLAUDE.md + AGENTS.md
  npx agent-scaffold doctor                    # Check scaffold health
  npx agent-scaffold install-skill             # Install as Claude Code skill

What it creates (default):
  CLAUDE.md, AGENTS.md, MEMORY.md, DECISIONS.md, WIP.md,
  memory/, .gitignore updates

With --signals:
  + signals/active/, signals/observations/, signals/archive/,
    signals/README.md, example YAML files

Features:
  - Auto-detects language, framework, build/test/lint commands
  - Monorepo support (pnpm workspaces, Lerna, npm workspaces)
  - Generates CLAUDE.md and AGENTS.md with real project values
  - Supports: Node.js/TS, Python, Rust, Go, Java
  - Idempotent: never overwrites existing files
`);
}

// --------------- Parse args & dispatch ---------------

const rawArgs = process.argv.slice(2);
const { flags, positional } = parseFlags(rawArgs);
const cmd = positional[0];

switch (cmd) {
  case "init":
    cmdInit(positional[1], flags);
    break;
  case "doctor":
    cmdDoctor(positional[1]);
    break;
  case "install-skill":
    cmdInstallSkill();
    break;
  case "--help":
  case "-h":
  case "help":
    showHelp();
    break;
  case undefined:
    showHelp();
    break;
  default:
    err(`Unknown command: ${cmd}. Run "agent-scaffold --help" for usage.`);
}
