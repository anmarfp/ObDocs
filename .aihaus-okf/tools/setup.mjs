#!/usr/bin/env node
/**
 * aihaus-okf setup — clone-to-use installer.
 *
 * Usage:
 *   node <engine>/.aihaus-okf/tools/setup.mjs <targetDir>
 *
 * What it does (per the root README contract):
 *   1. Copies the root routers into <targetDir>:
 *        CLAUDE.md, AGENTS.md, .cursor/rules/aihaus-okf.mdc, .gitignore
 *   2. Copies the whole `.aihaus-okf/` engine folder (workflows, agents, skills, tools)
 *      plus the durable memory templates (project pages + this protocol README), seeding an
 *      EMPTY board: kanban status folders are kept with `.gitkeep`.
 *   3. NEVER copies code-index DATA (memory/codebase/index.sqlite, graph.json, caches) — that
 *      is rebuildable per project. The committed memory/codebase/README.md IS copied.
 *   4. NEVER overwrites a file that already exists in the target; it prints what it skipped.
 *
 * Engine root is resolved relative to THIS script's location (…/.aihaus-okf/tools/setup.mjs),
 * so it works no matter where the repo was cloned. Built-ins only (fs, path, url). `node --check` clean.
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

// ---------------------------------------------------------------------------
// Resolve engine layout from this script's location
// ---------------------------------------------------------------------------

const __dirname = path.dirname(url.fileURLToPath(import.meta.url)); // <repo>/.aihaus-okf/tools
const ENGINE_DIR = path.resolve(__dirname, "..");                  // <repo>/.aihaus-okf
const REPO_ROOT = path.resolve(ENGINE_DIR, "..");                  // <repo> (holds CLAUDE.md etc.)

// Root router files (relative to REPO_ROOT) copied verbatim into the target root.
// NOTE: the engine repo's own root README.md is intentionally NOT shipped — it is the
// engine's clone-to-use guide, not a per-project file. Consumers get `.aihaus-okf/README.md`
// (the engine overview), which IS copied as part of the engine folder below.
const ROOT_ROUTERS = [
  "CLAUDE.md",
  "AGENTS.md",
  ".cursor/rules/aihaus-okf.mdc",
  ".gitignore",
];

// Inside .aihaus-okf/, never copy rebuildable code-index DATA (it is per-project, git-ignored).
// Paths are relative to ENGINE_DIR, posix-style. The committed README.md is allowed through.
const ENGINE_EXCLUDE = new Set([
  "memory/codebase/index.sqlite",
  "memory/codebase/graph.json",
]);
// Extra guards: any sqlite sidecar / cache files, plus an existing populated board.
const ENGINE_EXCLUDE_DIRS = new Set([
  "memory/codebase/.cache",
]);

// Kanban status folders that must exist (empty, with .gitkeep) in a fresh install.
const KANBAN_STATUSES = ["backlog", "todo", "doing", "review", "done"];

// ---------------------------------------------------------------------------
// Small fs helpers (built-ins only)
// ---------------------------------------------------------------------------

const report = { copied: [], skipped: [], created: [] };

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

/** Copy a single file if the destination does not already exist. Records the outcome. */
function copyFileSafe(src, dest, label) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (exists(dest)) {
    report.skipped.push(label ?? dest);
    return;
  }
  fs.copyFileSync(src, dest);
  report.copied.push(label ?? dest);
}

/** True if an engine-relative posix path should be excluded from the copy. */
function isExcludedEnginePath(relPosix) {
  if (ENGINE_EXCLUDE.has(relPosix)) return true;
  for (const dir of ENGINE_EXCLUDE_DIRS) {
    if (relPosix === dir || relPosix.startsWith(dir + "/")) return true;
  }
  // Belt-and-suspenders: skip any stray sqlite artifacts under the codebase cache.
  if (relPosix.startsWith("memory/codebase/") && /\.sqlite(-.*)?$/.test(relPosix)) return true;
  // Seed an EMPTY board: copy the kanban README + .gitkeep folders, but never carry over the
  // engine repo's own task files (those are this repo's work, not the new project's).
  if (relPosix.startsWith("memory/kanban/")) {
    const base = relPosix.slice("memory/kanban/".length);
    const isTaskFile = base.includes("/") && /\.md$/.test(base) && path.basename(base) !== "README.md";
    if (isTaskFile) return true;
  }
  return false;
}

/** Recursively copy the engine dir, honoring exclusions and never overwriting. */
function copyEngine(srcDir, destDir, baseSrc) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const relPosix = toPosix(path.relative(baseSrc, srcPath));
    if (isExcludedEnginePath(relPosix)) {
      const why = relPosix.startsWith("memory/kanban/")
        ? "engine's own task — board seeded empty"
        : "rebuildable index data — not copied";
      report.skipped.push(`.aihaus-okf/${relPosix} (${why})`);
      continue;
    }
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      if (!exists(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
        report.created.push(`.aihaus-okf/${relPosix}/`);
      }
      copyEngine(srcPath, destPath, baseSrc);
    } else if (entry.isFile()) {
      copyFileSafe(srcPath, destPath, `.aihaus-okf/${relPosix}`);
    }
  }
}

/** Ensure each kanban status folder exists with a .gitkeep (empty board). */
function seedKanban(engineDest) {
  for (const status of KANBAN_STATUSES) {
    const dir = path.join(engineDest, "memory", "kanban", status);
    fs.mkdirSync(dir, { recursive: true });
    const keep = path.join(dir, ".gitkeep");
    if (!exists(keep)) {
      fs.writeFileSync(keep, "");
      report.created.push(`.aihaus-okf/memory/kanban/${status}/.gitkeep`);
    }
  }
}

/** Ensure the codebase data dir exists (empty) so a first `index.mjs build` has a home. */
function seedCodebaseDir(engineDest) {
  const dir = path.join(engineDest, "memory", "codebase");
  fs.mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function fail(message) {
  process.stderr.write(`aihaus-okf setup: ${message}\n`);
  process.exit(1);
}

function main() {
  const targetArg = process.argv[2];
  if (!targetArg) {
    fail("usage: node <engine>/.aihaus-okf/tools/setup.mjs <targetDir>");
  }

  const targetDir = path.resolve(process.cwd(), targetArg);
  if (!exists(ENGINE_DIR)) {
    fail(`engine folder not found at ${ENGINE_DIR}`);
  }

  // Guard: refuse to install onto itself.
  if (path.resolve(targetDir) === REPO_ROOT) {
    fail("target is the engine repo itself — choose a different project directory.");
  }

  fs.mkdirSync(targetDir, { recursive: true });

  // 1. Root routers.
  for (const rel of ROOT_ROUTERS) {
    const src = path.join(REPO_ROOT, rel);
    if (!exists(src)) {
      report.skipped.push(`${rel} (not present in engine — skipped)`);
      continue;
    }
    copyFileSafe(src, path.join(targetDir, rel), rel);
  }

  // 2. Engine folder (.aihaus-okf/), excluding rebuildable index data.
  const engineDest = path.join(targetDir, ".aihaus-okf");
  if (!exists(engineDest)) {
    fs.mkdirSync(engineDest, { recursive: true });
    report.created.push(".aihaus-okf/");
  }
  copyEngine(ENGINE_DIR, engineDest, ENGINE_DIR);

  // 3. Seed an empty board + a home for the rebuildable code index.
  seedKanban(engineDest);
  seedCodebaseDir(engineDest);

  // ----- Report -----
  const out = [];
  out.push(`aihaus-okf installed into: ${toPosix(path.relative(process.cwd(), targetDir)) || "."}`);
  out.push(`  copied : ${report.copied.length} file(s)`);
  out.push(`  created: ${report.created.length} folder(s)/placeholder(s)`);
  out.push(`  skipped: ${report.skipped.length} (already existed or intentionally not copied)`);
  if (report.skipped.length) {
    out.push("");
    out.push("Skipped (left untouched):");
    for (const s of report.skipped) out.push(`  - ${s}`);
  }
  out.push("");
  out.push("Next: open the project in your agent. It reads .aihaus-okf/routing.md first.");
  out.push(`Build the code index when ready: node .aihaus-okf/tools/index.mjs build`);
  process.stdout.write(out.join("\n") + "\n");
}

main();
