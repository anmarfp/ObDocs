#!/usr/bin/env node
// scan.mjs — deterministic, READ-ONLY project detector for aihaus-okf.
//
// The init-project skill runs this FIRST to get a baseline before dispatching
// researcher workers. It detects languages, package managers + manifests,
// build/test/run/lint/dev commands, likely frameworks, entry points, monorepo
// workspaces, VCS, and rough file/LOC counts — then prints a human report, or
// machine JSON with `--json`.
//
// Contract:
//   - Node ESM, Node BUILT-INS ONLY (fs, path, url). No deps, no install.
//   - READ-ONLY. It never writes, edits, moves, or deletes a single file.
//   - Pure inference. Unknowns are reported as empty, never invented.
//   - Ported from aipi's inventoryRepository() heuristics, adapted to okf.
//
// Usage:
//   node .aihaus-okf/tools/scan.mjs [target-dir] [--json] [--max-files N]
//   (target-dir defaults to the current working directory)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── Tunables ──────────────────────────────────────────────────────────────────
const SKIP_DIRS = new Set([
  ".git", "node_modules", "dist", "build", "out", "coverage", ".next",
  ".nuxt", ".expo", ".venv", "venv", "__pycache__", ".gradle", "target",
  "vendor", ".aihaus-okf", ".idea", ".vscode", ".turbo", ".cache",
]);

// Extension → language label, and whether it counts as "source" for LOC.
const LANGUAGE_EXTENSIONS = new Map([
  [".js", "JavaScript"], [".mjs", "JavaScript"], [".cjs", "JavaScript"],
  [".jsx", "JavaScript (JSX)"], [".ts", "TypeScript"], [".tsx", "TypeScript (TSX)"],
  [".py", "Python"], [".go", "Go"], [".rs", "Rust"], [".rb", "Ruby"],
  [".php", "PHP"], [".java", "Java"], [".kt", "Kotlin"], [".cs", "C#"],
  [".c", "C"], [".h", "C/C++ header"], [".cc", "C++"], [".cpp", "C++"],
  [".swift", "Swift"], [".scala", "Scala"], [".clj", "Clojure"],
  [".ex", "Elixir"], [".exs", "Elixir"], [".dart", "Dart"], [".lua", "Lua"],
  [".sh", "Shell"], [".sql", "SQL"], [".vue", "Vue"], [".svelte", "Svelte"],
]);
const SOURCE_EXTENSIONS = new Set([...LANGUAGE_EXTENSIONS.keys()]);

// Manifest filename → package manager / ecosystem label.
const MANIFESTS = new Map([
  ["package.json", "npm/node"],
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["package-lock.json", "npm"],
  ["bun.lockb", "bun"],
  ["go.mod", "go modules"],
  ["pyproject.toml", "python (pep621/poetry)"],
  ["requirements.txt", "pip"],
  ["Pipfile", "pipenv"],
  ["Cargo.toml", "cargo"],
  ["pom.xml", "maven"],
  ["build.gradle", "gradle"],
  ["build.gradle.kts", "gradle"],
  ["Gemfile", "bundler"],
  ["composer.json", "composer"],
  ["mix.exs", "mix"],
  ["pubspec.yaml", "pub"],
]);

// ── Filesystem walk (read-only) ───────────────────────────────────────────────
function walk(root, maxFiles) {
  const files = [];
  let truncated = false;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue; // unreadable dir — skip, never throw
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) continue; // don't follow links
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        stack.push(abs);
      } else if (entry.isFile()) {
        if (files.length >= maxFiles) {
          truncated = true;
          continue;
        }
        files.push(path.relative(root, abs).split(path.sep).join("/"));
      }
    }
  }
  return { files: files.sort(), truncated };
}

function readText(abs) {
  try {
    return fs.readFileSync(abs, "utf8");
  } catch {
    return null;
  }
}

function readJson(abs) {
  const text = readText(abs);
  if (text == null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function countLines(abs) {
  const text = readText(abs);
  if (text == null) return 0;
  if (text === "") return 0;
  let lines = 1;
  for (let i = 0; i < text.length; i += 1) if (text.charCodeAt(i) === 10) lines += 1;
  return lines;
}

// ── Detectors ─────────────────────────────────────────────────────────────────
function detectLanguages(root, files) {
  const counts = new Map();
  let loc = 0;
  for (const rel of files) {
    const ext = path.extname(rel).toLowerCase();
    const language = LANGUAGE_EXTENSIONS.get(ext);
    if (!language) continue;
    counts.set(language, (counts.get(language) ?? 0) + 1);
    if (SOURCE_EXTENSIONS.has(ext)) loc += countLines(path.join(root, rel));
  }
  const languages = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([language, count]) => ({ language, count }));
  return { languages, loc };
}

function detectManifests(root, files) {
  const manifests = [];
  const managers = new Set();
  for (const rel of files) {
    const base = path.basename(rel);
    const manager = MANIFESTS.get(base);
    if (!manager) continue;
    manifests.push({ path: rel, file: base, manager });
    managers.add(manager);
  }
  return { manifests, managers: [...managers].sort() };
}

// package.json scripts + npm workspaces.
function readNodeManifests(root, files) {
  const node = [];
  for (const rel of files.filter((f) => path.basename(f) === "package.json")) {
    const parsed = readJson(path.join(root, rel));
    if (!parsed || typeof parsed !== "object") continue;
    let workspaces = [];
    if (Array.isArray(parsed.workspaces)) workspaces = parsed.workspaces;
    else if (parsed.workspaces && Array.isArray(parsed.workspaces.packages)) {
      workspaces = parsed.workspaces.packages;
    }
    node.push({
      path: rel,
      name: typeof parsed.name === "string" ? parsed.name : null,
      scripts: parsed.scripts && typeof parsed.scripts === "object" ? parsed.scripts : {},
      dependencies: Object.keys(parsed.dependencies ?? {}),
      devDependencies: Object.keys(parsed.devDependencies ?? {}),
      workspaces,
    });
  }
  return node;
}

// Makefile target names (lines like `target:` that aren't variables/patterns).
function readMakefileTargets(root, files) {
  const out = [];
  for (const rel of files.filter((f) => /(^|\/)(GNUmakefile|[Mm]akefile)$/.test(f))) {
    const text = readText(path.join(root, rel));
    if (text == null) continue;
    for (const line of text.split(/\r?\n/)) {
      const m = /^([A-Za-z0-9][A-Za-z0-9._-]*)\s*:(?!=)/.exec(line);
      if (m && m[1] !== ".PHONY") out.push({ path: rel, target: m[1] });
    }
  }
  return out;
}

// Map detected scripts/targets into the okf command buckets.
function detectCommands(node, makeTargets, managers) {
  const buckets = { test: [], build: [], run: [], lint: [], dev: [] };
  const classify = (name) => {
    const n = name.toLowerCase();
    if (/(^|[-_:])(test|spec|jest|vitest|pytest)/.test(n)) return "test";
    if (/(^|[-_:])(build|compile|bundle|dist|export)/.test(n)) return "build";
    if (/(^|[-_:])(lint|format|fmt|prettier|eslint|typecheck|tsc)/.test(n)) return "lint";
    if (/(^|[-_:])(dev|watch|hmr)/.test(n)) return "dev";
    if (/(^|[-_:])(start|serve|run|preview)/.test(n)) return "run";
    return null;
  };
  for (const m of node) {
    for (const [name, cmd] of Object.entries(m.scripts)) {
      const bucket = classify(name);
      if (bucket) buckets[bucket].push({ source: m.path, name, cmd: `npm run ${name}`, raw: cmd });
    }
  }
  for (const t of makeTargets) {
    const bucket = classify(t.target);
    if (bucket) buckets[bucket].push({ source: t.path, name: t.target, cmd: `make ${t.target}`, raw: null });
  }
  // Ecosystem defaults when nothing explicit was declared.
  if (managers.includes("pip") || managers.includes("python (pep621/poetry)") || managers.includes("pipenv")) {
    if (!buckets.test.length) buckets.test.push({ source: "convention", name: "pytest", cmd: "pytest", raw: null });
  }
  if (managers.includes("go modules")) {
    if (!buckets.test.length) buckets.test.push({ source: "convention", name: "go test", cmd: "go test ./...", raw: null });
    if (!buckets.build.length) buckets.build.push({ source: "convention", name: "go build", cmd: "go build ./...", raw: null });
  }
  if (managers.includes("cargo")) {
    if (!buckets.test.length) buckets.test.push({ source: "convention", name: "cargo test", cmd: "cargo test", raw: null });
    if (!buckets.build.length) buckets.build.push({ source: "convention", name: "cargo build", cmd: "cargo build", raw: null });
  }
  return buckets;
}

function detectFrameworks(node, files, managers, scanRoot) {
  const deps = new Set(node.flatMap((m) => [...m.dependencies, ...m.devDependencies]));
  const frameworks = [];
  const add = (name) => { if (!frameworks.includes(name)) frameworks.push(name); };
  // JS/TS heuristics (dependency-driven).
  if (deps.has("next")) add("Next.js");
  if (deps.has("react-native") || deps.has("expo")) add("React Native");
  else if (deps.has("react")) add("React");
  if (deps.has("vue") || deps.has("nuxt")) add("Vue/Nuxt");
  if (deps.has("svelte") || deps.has("@sveltejs/kit")) add("Svelte/SvelteKit");
  if (deps.has("@angular/core")) add("Angular");
  if (deps.has("express")) add("Express");
  if (deps.has("fastify")) add("Fastify");
  if (deps.has("@nestjs/core")) add("NestJS");
  if (deps.has("vite")) add("Vite");
  if (deps.has("jest")) add("Jest");
  if (deps.has("vitest")) add("Vitest");
  if (deps.has("electron")) add("Electron");
  // File/manifest heuristics for non-JS ecosystems.
  const has = (re) => files.some((f) => re.test(f));
  if (has(/(^|\/)manage\.py$/)) add("Django");
  for (const rel of files.filter((f) => /(requirements.*\.txt|pyproject\.toml)$/.test(f))) {
    const body = (readText(path.join(scanRoot, rel)) || "").toLowerCase();
    if (/fastapi/.test(body)) add("FastAPI");
    if (/\bflask\b/.test(body)) add("Flask");
    if (/\bdjango\b/.test(body)) add("Django");
  }
  if (managers.includes("maven") || managers.includes("gradle")) {
    if (has(/spring/i)) add("Spring");
  }
  return frameworks;
}

function detectEntryPoints(node, files) {
  const candidates = [
    "main.go", "cmd/main.go", "src/main.rs", "main.py", "app.py",
    "manage.py", "src/main.ts", "src/main.js", "src/index.ts", "src/index.js",
    "index.js", "index.ts", "App.tsx", "src/App.tsx", "main.ts",
    "src/main/java", "Program.cs",
  ];
  const fileSet = new Set(files);
  const entries = candidates.filter((c) => fileSet.has(c));
  // Each package.json is itself an entry surface (its `start`/`dev` scripts run the app).
  for (const m of node) {
    if (m.scripts.start || m.scripts.dev || m.scripts.serve) entries.push(m.path);
  }
  return [...new Set(entries)];
}

function detectWorkspaces(node, files) {
  const ws = [];
  for (const m of node) {
    for (const pattern of m.workspaces) ws.push({ root: m.path, pattern });
  }
  // pnpm / go work files are signals too.
  if (files.some((f) => path.basename(f) === "pnpm-workspace.yaml")) {
    ws.push({ root: "pnpm-workspace.yaml", pattern: "(see file)" });
  }
  if (files.some((f) => path.basename(f) === "go.work")) {
    ws.push({ root: "go.work", pattern: "(see file)" });
  }
  return { isMonorepo: ws.length > 0 || node.length > 1, workspaces: ws };
}

function detectVcs(root, files) {
  const vcs = [];
  if (fs.existsSync(path.join(root, ".git"))) vcs.push("git");
  if (fs.existsSync(path.join(root, ".hg"))) vcs.push("mercurial");
  if (fs.existsSync(path.join(root, ".svn"))) vcs.push("svn");
  const ci = files.filter((f) =>
    /^\.github\/workflows\/.+\.ya?ml$/.test(f) ||
    /^\.gitlab-ci\.ya?ml$/.test(f) ||
    /(^|\/)(Jenkinsfile|\.circleci\/config\.yml|azure-pipelines\.yml)$/.test(f));
  const docker = files.filter((f) => /(^|\/)(Dockerfile|docker-compose\.ya?ml|compose\.ya?ml)$/.test(f));
  return { vcs, ci, docker };
}

// ── Top-level orchestration ───────────────────────────────────────────────────
export function scan(targetDir, { maxFiles = 20000 } = {}) {
  const root = path.resolve(targetDir);
  const { files, truncated } = walk(root, maxFiles);
  const { languages, loc } = detectLanguages(root, files);
  const { manifests, managers } = detectManifests(root, files);
  const node = readNodeManifests(root, files);
  const makeTargets = readMakefileTargets(root, files);
  const commands = detectCommands(node, makeTargets, managers);
  const frameworks = detectFrameworks(node, files, managers, root);
  const entryPoints = detectEntryPoints(node, files);
  const { isMonorepo, workspaces } = detectWorkspaces(node, files);
  const { vcs, ci, docker } = detectVcs(root, files);

  return {
    schema: "aihaus-okf-scan/1",
    root,
    generated: new Date().toISOString(),
    file_count: files.length,
    truncated,
    approx_loc: loc,
    languages,
    package_managers: managers,
    manifests,
    frameworks,
    entry_points: entryPoints,
    commands,
    monorepo: isMonorepo,
    workspaces,
    vcs,
    ci,
    docker,
  };
}

// ── Reporting ─────────────────────────────────────────────────────────────────
function listOrDash(items, render = (x) => x) {
  if (!items || items.length === 0) return "  (none detected)";
  return items.map((x) => `  - ${render(x)}`).join("\n");
}

function renderCommands(buckets) {
  const order = ["test", "build", "run", "dev", "lint"];
  const lines = [];
  for (const bucket of order) {
    const items = buckets[bucket] ?? [];
    if (!items.length) {
      lines.push(`  ${bucket.padEnd(6)} (none detected)`);
      continue;
    }
    for (const c of items) lines.push(`  ${bucket.padEnd(6)} ${c.cmd}   [${c.source}]`);
  }
  return lines.join("\n");
}

function renderReport(r) {
  return [
    `aihaus-okf scan — ${r.root}`,
    `${r.file_count} files${r.truncated ? " (truncated)" : ""} · ~${r.approx_loc} LOC · VCS: ${r.vcs.join(", ") || "none"}`,
    "",
    "Languages:",
    listOrDash(r.languages, (l) => `${l.language}: ${l.count}`),
    "",
    `Package managers: ${r.package_managers.join(", ") || "(none detected)"}`,
    "Manifests:",
    listOrDash(r.manifests, (m) => `${m.path} [${m.manager}]`),
    "",
    "Frameworks (heuristic):",
    listOrDash(r.frameworks),
    "",
    "Entry points (heuristic):",
    listOrDash(r.entry_points),
    "",
    "Commands:",
    renderCommands(r.commands),
    "",
    `Monorepo: ${r.monorepo ? "yes" : "no"}`,
    "Workspaces:",
    listOrDash(r.workspaces, (w) => `${w.root} → ${w.pattern}`),
    "",
    "CI:",
    listOrDash(r.ci),
    "Docker:",
    listOrDash(r.docker),
    "",
    "Note: heuristic baseline only. Unknowns are empty, never invented — confirm against the code.",
  ].join("\n");
}

// ── CLI ───────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { target: ".", json: false, maxFiles: 20000 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--json") args.json = true;
    else if (a === "--max-files") { args.maxFiles = Number(argv[i + 1]) || args.maxFiles; i += 1; }
    else if (a === "--help" || a === "-h") args.help = true;
    else if (!a.startsWith("-")) args.target = a;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(
      "Usage: node .aihaus-okf/tools/scan.mjs [target-dir] [--json] [--max-files N]\n" +
      "Read-only project detector. Prints a report, or machine JSON with --json.\n");
    return;
  }
  const result = scan(args.target, { maxFiles: args.maxFiles });
  if (args.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else process.stdout.write(`${renderReport(result)}\n`);
}

// Run only when invoked directly (not when imported).
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
