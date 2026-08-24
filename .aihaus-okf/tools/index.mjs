#!/usr/bin/env node
/**
 * aihaus-okf code indexer — the ONE code-index interface.
 *
 * CLI (per memory/codebase/README.md):
 *   node .aihaus-okf/tools/index.mjs status
 *   node .aihaus-okf/tools/index.mjs query "<text>" [--top N] [--json]
 *   node .aihaus-okf/tools/index.mjs callers <symbol>
 *   node .aihaus-okf/tools/index.mjs impact <path>
 *   node .aihaus-okf/tools/index.mjs build
 *   node .aihaus-okf/tools/index.mjs update [paths...]
 *
 * Design (ported from aipi's aipi-tools.js, adapted to okf — short, file-first):
 *   - Data lives in .aihaus-okf/memory/codebase/  ->  index.sqlite + graph.json (git-ignored, rebuildable).
 *   - SCOPE: source CODE ONLY. .md/.json/.yaml and everything under memory/ are never indexed
 *     (mirrors aipi's VECTOR_EMBED_EXTENSIONS scope guard). Markdown is the brain, not a vector.
 *   - Embeddings: local Ollama bge-m3 (1024-dim) over HTTP. Nothing leaves the machine.
 *   - Vector store: better-sqlite3 + sqlite-vec  ->  `code_vectors USING vec0(embedding float[1024])`
 *     if those deps import; else node:sqlite + sqlite-vec; else DEGRADE LOUDLY to a pure-JS
 *     lexical index (inverted token index in graph.json) — ZERO native deps, still works.
 *   - Retrieval: RRF fusion of semantic + lexical signals (aipi's reciprocal_rank_fusion).
 *   - "markdown/code wins over the index": this is a cache; if stale, rebuild — never argue with it.
 *
 * Every optional dependency (better-sqlite3, node:sqlite, sqlite-vec, Ollama) is guarded in
 * try/catch and degrades loudly. Passes `node --check`. No third-party deps are required to run.
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import url from "node:url";

// ---------------------------------------------------------------------------
// Constants (ported from aipi)
// ---------------------------------------------------------------------------

const VECTOR_DIMENSIONS = 1024;
const OLLAMA_HOST = process.env.AIHAUS_OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.AIHAUS_OLLAMA_MODEL || "bge-m3";
const OLLAMA_EMBED_PATH = "/api/embeddings"; // Ollama embeddings endpoint
const OLLAMA_TAGS_PATH = "/api/tags";

// RRF fusion knobs (aipi HYBRID_RRF_K / HYBRID_SIGNAL_WEIGHTS).
const RRF_K = 60;
const SIGNAL_WEIGHTS = { semantic: 1.0, lexical: 1.15 };

// Scope guard — index CODE ONLY. Mirrors aipi VECTOR_EMBED_EXTENSIONS.
// Intentionally EXCLUDES .md / .json / .yaml / .yml (those are memory, addressed by name).
const CODE_EXTENSIONS = new Set([
  ".c", ".cc", ".cjs", ".cpp", ".cs", ".css", ".go", ".h", ".hpp", ".html",
  ".java", ".js", ".jsx", ".kt", ".mjs", ".php", ".py", ".rb", ".rs", ".scala",
  ".sh", ".sql", ".swift", ".ts", ".tsx", ".vue",
]);

const SKIP_DIRS = new Set([
  ".git", ".aihaus-okf-engine", "node_modules", ".next", "dist", "build",
  "coverage", ".expo", ".venv", "venv", "__pycache__", ".turbo", ".gradle",
  ".cache", "out", "target", "vendor",
]);

// Never index the engine's own memory/ tree (markdown brain + this cache).
const SKIP_REL_PREFIXES = [".aihaus-okf/memory/"];

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(url.fileURLToPath(import.meta.url)); // .aihaus-okf/tools
const ENGINE_ROOT = path.resolve(__dirname, ".."); // .aihaus-okf
const PROJECT_ROOT = path.resolve(ENGINE_ROOT, ".."); // project root (where the engine lives)
const CODEBASE_DIR = path.join(ENGINE_ROOT, "memory", "codebase");
const SQLITE_PATH = path.join(CODEBASE_DIR, "index.sqlite");
const GRAPH_PATH = path.join(CODEBASE_DIR, "graph.json");

// ---------------------------------------------------------------------------
// Optional dependency loaders — all guarded, all may return null
// ---------------------------------------------------------------------------

async function loadBetterSqlite() {
  try {
    const mod = await import("better-sqlite3");
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

async function loadNodeSqlite() {
  try {
    const mod = await import("node:sqlite");
    return mod.DatabaseSync ? mod : null;
  } catch {
    return null;
  }
}

async function loadSqliteVec() {
  try {
    const mod = await import("sqlite-vec");
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

/**
 * Open a sqlite DB with sqlite-vec loaded, preferring better-sqlite3 then node:sqlite.
 * Returns { db, kind, vec, close } or null if no sqlite backend + sqlite-vec is usable.
 */
async function openVectorDb(filePath, { create = false } = {}) {
  const sqliteVec = await loadSqliteVec();
  if (!sqliteVec) return null;

  const Better = await loadBetterSqlite();
  if (Better) {
    try {
      if (!create && !fs.existsSync(filePath)) return null;
      const db = new Better(filePath);
      db.pragma("journal_mode = WAL");
      sqliteVec.load(db);
      const version = db.prepare("SELECT vec_version() AS v").get()?.v ?? null;
      return {
        db,
        kind: "better-sqlite3",
        vecVersion: version,
        run: (sql, params = []) => db.prepare(sql).run(...params),
        exec: (sql) => db.exec(sql),
        all: (sql, params = []) => db.prepare(sql).all(...params),
        get: (sql, params = []) => db.prepare(sql).get(...params),
        close: () => { try { db.close(); } catch { /* best-effort */ } },
      };
    } catch {
      /* fall through to node:sqlite */
    }
  }

  const node = await loadNodeSqlite();
  if (node) {
    try {
      if (!create && !fs.existsSync(filePath)) return null;
      const db = new node.DatabaseSync(filePath, { allowExtension: true });
      db.enableLoadExtension?.(true);
      sqliteVec.load(db);
      db.enableLoadExtension?.(false);
      const version = db.prepare("SELECT vec_version() AS v").get()?.v ?? null;
      return {
        db,
        kind: "node:sqlite",
        vecVersion: version,
        run: (sql, params = []) => db.prepare(sql).run(...params),
        exec: (sql) => db.exec(sql),
        all: (sql, params = []) => db.prepare(sql).all(...params),
        get: (sql, params = []) => db.prepare(sql).get(...params),
        close: () => { try { db.close(); } catch { /* best-effort */ } },
      };
    } catch {
      /* fall through to lexical */
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Embeddings (Ollama bge-m3 over HTTP, via global fetch). Loud failure.
// ---------------------------------------------------------------------------

function ollamaUrl(suffix) {
  const host = String(OLLAMA_HOST).replace(/\/+$/, "");
  const base = /^https?:\/\//i.test(host) ? host : `http://${host}`;
  return `${base}${suffix}`;
}

/** Returns { ok, model, version } or { ok:false, reason }. Never throws. */
async function probeOllama() {
  if (typeof fetch !== "function") {
    return { ok: false, reason: "global fetch unavailable (Node < 18)" };
  }
  try {
    const res = await fetch(ollamaUrl(OLLAMA_TAGS_PATH), { method: "GET" });
    if (!res.ok) return { ok: false, reason: `Ollama HTTP ${res.status}` };
    const body = await res.json().catch(() => ({}));
    const models = Array.isArray(body?.models) ? body.models.map((m) => m?.name ?? "") : [];
    const hasModel = models.some((n) => String(n).split(":")[0] === OLLAMA_MODEL);
    if (!hasModel) {
      return { ok: false, reason: `Ollama is up but model '${OLLAMA_MODEL}' not pulled (run: ollama pull ${OLLAMA_MODEL})` };
    }
    return { ok: true, model: OLLAMA_MODEL };
  } catch (error) {
    return { ok: false, reason: `Ollama unreachable at ${OLLAMA_HOST}: ${String(error?.message ?? error)}` };
  }
}

/**
 * Embed text via Ollama bge-m3. Returns a Float32 number[] of length VECTOR_DIMENSIONS,
 * or throws (callers degrade to lexical). Ported from aipi embedText.
 */
async function embedText(text) {
  if (typeof fetch !== "function") throw new Error("global fetch unavailable");
  const input = String(text ?? "");
  let res;
  try {
    res = await fetch(ollamaUrl(OLLAMA_EMBED_PATH), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt: input }),
    });
  } catch (error) {
    throw new Error(`Ollama embedding request failed: ${String(error?.message ?? error)}`);
  }
  if (!res?.ok) throw new Error(`Ollama embedding HTTP ${res?.status ?? "?"}`);
  const body = await res.json().catch(() => null);
  const vector = extractEmbedding(body);
  if (!Array.isArray(vector)) throw new Error("Ollama response had no embedding vector");
  if (vector.length !== VECTOR_DIMENSIONS) {
    throw new Error(`Ollama returned ${vector.length} dims; expected ${VECTOR_DIMENSIONS}`);
  }
  return vector.map((v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error("embedding contained a non-numeric value");
    return n;
  });
}

// Accept either /api/embeddings ({embedding}) or /api/embed ({embeddings:[[...]]}) shapes.
function extractEmbedding(body) {
  if (Array.isArray(body?.embedding)) return body.embedding;
  if (Array.isArray(body?.embeddings?.[0])) return body.embeddings[0];
  if (Array.isArray(body?.data?.[0]?.embedding)) return body.data[0].embedding;
  return null;
}

function vectorFloat32Blob(vector) {
  const floats = new Float32Array(vector.length);
  for (let i = 0; i < vector.length; i++) floats[i] = Number(vector[i]);
  return Buffer.from(floats.buffer);
}

// ---------------------------------------------------------------------------
// File walking + parsing (scope: code only)
// ---------------------------------------------------------------------------

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function isSkippedRel(relPath) {
  const rel = toPosix(relPath);
  return SKIP_REL_PREFIXES.some((prefix) => rel.startsWith(prefix));
}

function isCodeFile(relPath) {
  if (isSkippedRel(relPath)) return false;
  return CODE_EXTENSIONS.has(path.extname(relPath).toLowerCase());
}

/** Walk PROJECT_ROOT and return relative posix paths of code files. */
async function collectCodeFiles(root = PROJECT_ROOT) {
  const out = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const rel = toPosix(path.relative(root, abs));
        if (isSkippedRel(rel + "/")) continue;
        await walk(abs);
      } else if (entry.isFile()) {
        const rel = toPosix(path.relative(root, abs));
        if (isCodeFile(rel)) out.push(rel);
      }
    }
  }
  await walk(root);
  return out.sort();
}

function lineNumberForIndex(content, index) {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content[i] === "\n") line++;
  }
  return line;
}

/** Extract coarse symbols (functions/classes/consts). Ported from aipi extractSymbols. */
function extractSymbols(content, relPath) {
  const symbols = [];
  const patterns = [
    /\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /\bclass\s+([A-Za-z_$][\w$]*)/g,
    /\b(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=/g,
    /\b(?:export\s+)?(?:let|var)\s+([A-Za-z_$][\w$]*)\s*=/g,
    /\bdef\s+([A-Za-z_$][\w$]*)\s*\(/g,           // python
    /\bfunc\s+([A-Za-z_$][\w$]*)\s*\(/g,          // go
    /\bfn\s+([A-Za-z_$][\w$]*)\s*[(<]/g,          // rust
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      symbols.push({ name: match[1], path: relPath, line: lineNumberForIndex(content, match.index ?? 0) });
    }
  }
  return symbols;
}

// Cheap import/require edges: source file -> imported module string.
function extractImports(content, relPath) {
  const edges = [];
  const patterns = [
    /\bimport\s+[^"'`]*?from\s+["'`]([^"'`]+)["'`]/g,
    /\bimport\s+["'`]([^"'`]+)["'`]/g,
    /\brequire\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
    /\bfrom\s+([A-Za-z_.][\w.]*)\s+import\b/g,     // python
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      edges.push({ from: relPath, to: match[1] });
    }
  }
  return edges;
}

function tokenize(text) {
  return String(text ?? "")
    .toLowerCase()
    .split(/[^a-z0-9_$]+/)
    .filter((t) => t.length >= 2 && t.length <= 40);
}

function excerptAround(lines, index, radius = 4) {
  const start = Math.max(0, index - radius);
  const end = Math.min(lines.length, index + radius + 1);
  return lines.slice(start, end).join("\n");
}

// ---------------------------------------------------------------------------
// Graph (lexical inverted index + symbols + import edges) — graph.json
// ---------------------------------------------------------------------------

/**
 * Build the graph.json model from a set of relative code paths. This is BOTH the
 * symbol/relationship graph (for callers/impact) AND the lexical fallback index.
 */
async function buildGraph(relPaths, root = PROJECT_ROOT) {
  const files = [];
  const symbols = [];
  const edges = [];
  // Inverted index: token -> array of { f: fileIdx, line }
  const postings = Object.create(null);

  for (let f = 0; f < relPaths.length; f++) {
    const rel = relPaths[f];
    const abs = path.join(root, rel);
    let content = "";
    try {
      content = await fsp.readFile(abs, "utf8");
    } catch {
      continue;
    }
    const lines = content.split(/\r?\n/);
    let stat = null;
    try { stat = await fsp.stat(abs); } catch { /* ignore */ }
    files.push({
      idx: f,
      path: rel,
      line_count: lines.length,
      size: stat?.size ?? content.length,
      mtime_ms: stat?.mtimeMs ?? 0,
    });

    for (const s of extractSymbols(content, rel)) symbols.push(s);
    for (const e of extractImports(content, rel)) edges.push(e);

    for (let i = 0; i < lines.length; i++) {
      const seen = new Set();
      for (const tok of tokenize(lines[i])) {
        if (seen.has(tok)) continue; // one posting per token per line
        seen.add(tok);
        (postings[tok] ||= []).push({ f, l: i + 1 });
      }
    }
  }

  return {
    schema: "aihaus-okf.codebase.v1",
    built_at: new Date().toISOString(),
    root: toPosix(path.relative(ENGINE_ROOT, root)) || ".",
    backend: "lexical",            // overwritten to "sqlite-vec+bge-m3" when vectors are written
    files,
    symbols,
    relationships: edges,
    postings,
  };
}

async function readGraph() {
  try {
    const raw = await fsp.readFile(GRAPH_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeGraph(graph) {
  await fsp.mkdir(CODEBASE_DIR, { recursive: true });
  // `postings` ARE the lexical index, so they stay in graph.json. Written compact (no indent).
  await fsp.writeFile(GRAPH_PATH, JSON.stringify(graph), "utf8");
}

// ---------------------------------------------------------------------------
// Lexical retrieval (pure JS fallback, always available once graph exists)
// ---------------------------------------------------------------------------

function lexicalSearch(graph, query, limit) {
  if (!graph?.postings || !graph?.files) return [];
  const tokens = [...new Set(tokenize(query))];
  if (!tokens.length) return [];
  // score by token-overlap per (file,line), token-overlap / inverted index (aipi lexical signal).
  const scores = new Map(); // key "f:l" -> { f, l, score }
  for (const tok of tokens) {
    const list = graph.postings[tok];
    if (!list) continue;
    const idf = Math.log(1 + graph.files.length / (1 + list.length));
    for (const post of list) {
      const key = `${post.f}:${post.l}`;
      const entry = scores.get(key) || { f: post.f, l: post.l, score: 0 };
      entry.score += idf;
      scores.set(key, entry);
    }
  }
  const ranked = [...scores.values()].sort((a, b) => b.score - a.score).slice(0, Math.max(1, limit) * 3);
  return ranked.map((r) => ({
    path: graph.files[r.f]?.path ?? "?",
    line: r.l,
    source: "lexical",
    score: r.score,
  }));
}

// Attach a source-line excerpt to a ref (best-effort read).
async function decorateExcerpt(ref, root = PROJECT_ROOT) {
  try {
    const lines = (await fsp.readFile(path.join(root, ref.path), "utf8")).split(/\r?\n/);
    ref.excerpt = excerptAround(lines, (ref.line ?? 1) - 1, 3);
  } catch {
    ref.excerpt = "";
  }
  return ref;
}

// ---------------------------------------------------------------------------
// Semantic retrieval (sqlite-vec, optional)
// ---------------------------------------------------------------------------

async function semanticSearch(query, limit) {
  const handle = await openVectorDb(SQLITE_PATH, { create: false });
  if (!handle) return [];
  try {
    // Confirm the vec table exists.
    const has = handle.get("SELECT name FROM sqlite_master WHERE type='table' AND name='code_vectors'");
    if (!has) return [];
    const embedding = await embedText(query); // throws if Ollama is down -> caller falls back
    const blob = vectorFloat32Blob(embedding);
    const rows = handle.all(
      `SELECT c.path AS path, c.start_line AS line, v.distance AS distance
         FROM code_vectors AS v
         JOIN vector_chunks AS c ON c.rowid = v.rowid
        WHERE v.embedding MATCH ? AND k = ?
        ORDER BY v.distance ASC
        LIMIT ?`,
      [blob, Math.max(1, limit), Math.max(1, limit)],
    );
    return rows.map((r) => ({ path: r.path, line: r.line, source: "semantic", distance: r.distance }));
  } catch {
    return []; // loud degrade happens at the status/build layer; query stays usable
  } finally {
    handle.close();
  }
}

// ---------------------------------------------------------------------------
// RRF fusion (aipi reciprocal_rank_fusion)
// ---------------------------------------------------------------------------

function fuse(signals, limit) {
  const candidates = new Map(); // key "path:line" -> candidate
  for (const signal of signals) {
    const weight = SIGNAL_WEIGHTS[signal.name] ?? 1;
    (signal.refs ?? []).forEach((ref, index) => {
      if (!ref?.path) return;
      const rank = index + 1;
      const contribution = weight / (RRF_K + rank);
      const key = `${ref.path}:${ref.line ?? 0}`;
      let cand = candidates.get(key);
      if (!cand) {
        cand = { path: ref.path, line: ref.line ?? 0, score: 0, signals: [] };
        candidates.set(key, cand);
      }
      cand.score += contribution;
      cand.signals.push(signal.name);
    });
  }
  return [...candidates.values()]
    .map((c) => ({ ...c, score: Number(c.score.toFixed(6)) }))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path) || a.line - b.line)
    .slice(0, Math.max(1, limit));
}

// ---------------------------------------------------------------------------
// SQLite vector index build (optional path)
// ---------------------------------------------------------------------------

/**
 * Build the sqlite-vec index from the graph's files. One embedded chunk per file
 * (the file's first ~120 non-empty lines as a representative chunk — okf keeps it simple).
 * Returns { ok, count, reason }.
 */
async function buildVectorIndex(graph, root = PROJECT_ROOT) {
  try { await fsp.rm(SQLITE_PATH, { force: true }); } catch { /* ignore */ }
  const handle = await openVectorDb(SQLITE_PATH, { create: true });
  if (!handle) return { ok: false, reason: "sqlite-vec backend unavailable" };

  try {
    handle.exec(`CREATE VIRTUAL TABLE code_vectors USING vec0(embedding float[${VECTOR_DIMENSIONS}])`);
    handle.exec(`CREATE TABLE vector_chunks (
      rowid INTEGER PRIMARY KEY,
      path TEXT NOT NULL,
      start_line INTEGER NOT NULL,
      end_line INTEGER NOT NULL,
      text TEXT
    )`);

    let rowid = 1;
    let count = 0;
    for (const file of graph.files) {
      let content = "";
      try {
        content = await fsp.readFile(path.join(root, file.path), "utf8");
      } catch {
        continue;
      }
      const lines = content.split(/\r?\n/);
      const chunkText = lines.filter((l) => l.trim()).slice(0, 120).join("\n").slice(0, 8000);
      if (!chunkText) continue;
      let embedding;
      try {
        embedding = await embedText(`${file.path}\n${chunkText}`);
      } catch (error) {
        handle.close();
        return { ok: false, count, reason: `embedding failed: ${String(error?.message ?? error)}` };
      }
      handle.run("INSERT INTO code_vectors(rowid, embedding) VALUES (?, ?)", [rowid, vectorFloat32Blob(embedding)]);
      handle.run("INSERT INTO vector_chunks(rowid, path, start_line, end_line, text) VALUES (?, ?, ?, ?, ?)",
        [rowid, file.path, 1, Math.min(lines.length, 120), chunkText]);
      rowid++;
      count++;
    }
    handle.close();
    return { ok: true, count };
  } catch (error) {
    handle.close();
    return { ok: false, reason: String(error?.message ?? error) };
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdBuild() {
  await fsp.mkdir(CODEBASE_DIR, { recursive: true });
  const mode = "build";
  const relPaths = await collectCodeFiles();
  const graph = await buildGraph(relPaths);

  // Try to build the semantic index; degrade loudly if it can't.
  const probe = await probeOllama();
  let vec = { ok: false, reason: "skipped" };
  const haveVecBackend = Boolean(await openVectorBackendProbe());
  if (probe.ok && haveVecBackend) {
    vec = await buildVectorIndex(graph);
    if (vec.ok) graph.backend = "sqlite-vec+bge-m3";
  }

  await writeGraph(graph);

  const lines = [];
  lines.push(`${mode === "update" ? "Updated" : "Built"} code index at ${rel(CODEBASE_DIR)}`);
  lines.push(`  files indexed : ${graph.files.length}`);
  lines.push(`  symbols       : ${graph.symbols.length}`);
  lines.push(`  import edges   : ${graph.relationships.length}`);
  if (vec.ok) {
    lines.push(`  backend       : sqlite-vec + bge-m3 (semantic ON, ${vec.count} chunks embedded)`);
  } else {
    lines.push(`  backend       : LEXICAL only (semantic OFF)`);
    if (!haveVecBackend) lines.push(`    reason: sqlite-vec / better-sqlite3 not installed`);
    else if (!probe.ok) lines.push(`    reason: ${probe.reason}`);
    else if (vec.reason) lines.push(`    reason: ${vec.reason}`);
    lines.push(`    fix: install deps (npm i better-sqlite3 sqlite-vec) and run Ollama (ollama pull ${OLLAMA_MODEL}), then rebuild.`);
  }
  process.stdout.write(lines.join("\n") + "\n");
}

async function openVectorBackendProbe() {
  // Cheap check that the backend modules import (without creating files).
  const sqliteVec = await loadSqliteVec();
  if (!sqliteVec) return false;
  if (await loadBetterSqlite()) return true;
  if (await loadNodeSqlite()) return true;
  return false;
}

function normalizeTargetPath(p) {
  const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
  return toPosix(path.relative(PROJECT_ROOT, abs));
}

async function cmdUpdate(paths) {
  if (!paths.length) {
    // No paths given: behave like a full rebuild of the lexical/graph layer.
    await cmdBuild();
    return;
  }
  // For correctness, an incremental update re-derives the full lexical index over the
  // union of unchanged + changed files (postings are positional). Cheap for small repos;
  // for large repos run a full `build`.
  const all = await collectCodeFiles();
  await cmdBuildFromList(all, paths);
}

async function cmdBuildFromList(allPaths, changedPaths) {
  await fsp.mkdir(CODEBASE_DIR, { recursive: true });
  const graph = await buildGraph(allPaths);
  const probe = await probeOllama();
  let vec = { ok: false, reason: "skipped" };
  if (probe.ok && (await openVectorBackendProbe())) {
    vec = await buildVectorIndex(graph);
    if (vec.ok) graph.backend = "sqlite-vec+bge-m3";
  }
  await writeGraph(graph);
  const norm = changedPaths.map(normalizeTargetPath);
  process.stdout.write(
    `Refreshed code index for ${norm.length} changed path(s); full lexical reindex over ${graph.files.length} files. ` +
    `Backend: ${graph.backend === "sqlite-vec+bge-m3" ? "semantic (bge-m3)" : "lexical"}.\n`,
  );
}

async function cmdStatus(asJson) {
  const graph = await readGraph();
  const probe = await probeOllama();
  const haveVecBackend = await openVectorBackendProbe();
  const sqliteExists = fs.existsSync(SQLITE_PATH);

  // Staleness: any code file newer than built_at => stale.
  let stale = null;
  if (graph?.built_at) {
    const builtMs = Date.parse(graph.built_at);
    let newest = 0;
    try {
      const files = await collectCodeFiles();
      for (const rel of files) {
        const st = await fsp.stat(path.join(PROJECT_ROOT, rel)).catch(() => null);
        if (st && st.mtimeMs > newest) newest = st.mtimeMs;
      }
    } catch { /* ignore */ }
    stale = Number.isFinite(builtMs) && newest > builtMs;
  }

  const backend = graph?.backend === "sqlite-vec+bge-m3" && sqliteExists ? "bge-m3 (semantic)" : "lexical";
  const status = {
    built: Boolean(graph),
    built_at: graph?.built_at ?? null,
    stale,
    backend,
    file_count: graph?.files?.length ?? 0,
    symbol_count: graph?.symbols?.length ?? 0,
    relationship_count: graph?.relationships?.length ?? 0,
    sqlite_present: sqliteExists,
    vec_backend_available: haveVecBackend,
    ollama: probe.ok ? { ok: true, model: OLLAMA_MODEL, host: OLLAMA_HOST } : { ok: false, reason: probe.reason },
    data_dir: rel(CODEBASE_DIR),
  };

  if (asJson) {
    process.stdout.write(JSON.stringify(status, null, 2) + "\n");
    return;
  }

  const out = [];
  out.push("aihaus-okf code index — status");
  out.push(`  data dir   : ${status.data_dir}`);
  out.push(`  built      : ${status.built ? status.built_at : "NO — run `build` (map-codebase skill)"}`);
  if (status.built) out.push(`  staleness  : ${stale === null ? "unknown" : stale ? "STALE (source newer than index — rebuild)" : "fresh"}`);
  out.push(`  backend    : ${backend.toUpperCase()}`);
  out.push(`  files      : ${status.file_count}  symbols: ${status.symbol_count}  edges: ${status.relationship_count}`);
  out.push(`  sqlite-vec : ${haveVecBackend ? "available" : "NOT installed (lexical fallback in use)"}`);
  out.push(`  ollama     : ${probe.ok ? `UP (${OLLAMA_MODEL} @ ${OLLAMA_HOST})` : `DOWN — ${probe.reason}`}`);
  if (!probe.ok || !haveVecBackend) {
    out.push(`  note       : running in LEXICAL mode. Semantic search needs sqlite-vec + Ollama bge-m3.`);
  }
  process.stdout.write(out.join("\n") + "\n");
}

async function cmdQuery(query, top, asJson) {
  if (!query || !query.trim()) {
    process.stderr.write("query requires text, e.g. index.mjs query \"login redirect\"\n");
    process.exitCode = 1;
    return;
  }
  const graph = await readGraph();
  if (!graph) {
    process.stderr.write("No index yet. Run `build` first (map-codebase skill).\n");
    process.exitCode = 1;
    return;
  }

  const limit = Math.max(1, top || 8);
  const signalLimit = Math.max(16, limit * 4);

  const lexicalRefs = lexicalSearch(graph, query, signalLimit);
  let semanticRefs = [];
  let semanticTried = false;
  if (graph.backend === "sqlite-vec+bge-m3") {
    semanticTried = true;
    semanticRefs = await semanticSearch(query, signalLimit);
  }

  const fused = fuse(
    [
      { name: "semantic", refs: semanticRefs },
      { name: "lexical", refs: lexicalRefs },
    ],
    limit,
  );
  for (const ref of fused) await decorateExcerpt(ref);

  const result = {
    query,
    backend: semanticRefs.length ? "semantic+lexical (RRF)" : "lexical",
    fusion: { method: "reciprocal_rank_fusion", k: RRF_K, weights: SIGNAL_WEIGHTS },
    refs: fused.map((r) => ({ path: r.path, line: r.line, score: r.score, signals: r.signals, excerpt: r.excerpt })),
  };

  if (asJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }

  const out = [];
  out.push(`query: ${query}`);
  out.push(`backend: ${result.backend}${semanticTried && !semanticRefs.length ? " (semantic backend present but returned nothing / Ollama down)" : ""}`);
  if (!fused.length) out.push("  (no matches)");
  for (const r of fused) {
    out.push("");
    out.push(`  ${r.path}:${r.line}   [${r.signals.join("+")}] score=${r.score}`);
    for (const line of String(r.excerpt ?? "").split("\n")) out.push(`    | ${line}`);
  }
  out.push("");
  out.push("Open the real file at each path:line to confirm — the index is a pointer, not truth.");
  process.stdout.write(out.join("\n") + "\n");
}

async function cmdCallers(symbol, asJson) {
  if (!symbol) {
    process.stderr.write("callers requires a symbol name\n");
    process.exitCode = 1;
    return;
  }
  const graph = await readGraph();
  if (!graph) {
    process.stderr.write("No index yet. Run `build` first.\n");
    process.exitCode = 1;
    return;
  }

  // Where is the symbol defined?
  const defs = (graph.symbols ?? []).filter((s) => s.name === symbol);
  // Who references it? Lexical scan of the symbol token across postings.
  const tokenRefs = lexicalSearch(graph, symbol, 200).filter((r) => {
    // exclude the definition lines themselves
    return !defs.some((d) => d.path === r.path && d.line === r.line);
  });

  const callers = tokenRefs.map((r) => ({ path: r.path, line: r.line }));
  for (const ref of callers) await decorateExcerpt(ref);

  const result = { symbol, definitions: defs, callers };
  if (asJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }
  const out = [];
  out.push(`callers of: ${symbol}`);
  out.push(`  defined at:`);
  if (!defs.length) out.push("    (no definition found in index)");
  for (const d of defs) out.push(`    ${d.path}:${d.line}`);
  out.push(`  referenced at (${callers.length}):`);
  if (!callers.length) out.push("    (no references found)");
  for (const c of callers.slice(0, 40)) out.push(`    ${c.path}:${c.line}`);
  process.stdout.write(out.join("\n") + "\n");
}

async function cmdImpact(targetPath, asJson) {
  if (!targetPath) {
    process.stderr.write("impact requires a path\n");
    process.exitCode = 1;
    return;
  }
  const graph = await readGraph();
  if (!graph) {
    process.stderr.write("No index yet. Run `build` first.\n");
    process.exitCode = 1;
    return;
  }
  const rel = normalizeTargetPath(targetPath);
  const base = path.basename(rel).replace(/\.[^.]+$/, "");

  // Files that import this path (by basename / module-ish substring).
  const importers = (graph.relationships ?? [])
    .filter((e) => {
      const to = String(e.to ?? "");
      return to.includes(base) && e.from !== rel;
    })
    .map((e) => e.from);

  // Symbols defined in this file, and where else they appear (blast radius).
  const ownSymbols = (graph.symbols ?? []).filter((s) => s.path === rel).map((s) => s.name);
  const touched = new Set(importers);
  for (const sym of [...new Set(ownSymbols)]) {
    for (const r of lexicalSearch(graph, sym, 100)) {
      if (r.path !== rel) touched.add(r.path);
    }
  }

  const result = {
    path: rel,
    own_symbols: [...new Set(ownSymbols)],
    importers: [...new Set(importers)],
    impacted_files: [...touched].sort(),
  };
  if (asJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }
  const out = [];
  out.push(`impact of: ${rel}`);
  out.push(`  symbols defined here: ${result.own_symbols.join(", ") || "(none detected)"}`);
  out.push(`  direct importers (${result.importers.length}):`);
  for (const i of result.importers) out.push(`    ${i}`);
  out.push(`  blast radius — files referencing this file's symbols (${result.impacted_files.length}):`);
  for (const f of result.impacted_files.slice(0, 60)) out.push(`    ${f}`);
  process.stdout.write(out.join("\n") + "\n");
}

// ---------------------------------------------------------------------------
// Arg parsing + dispatch
// ---------------------------------------------------------------------------

function rel(p) {
  return toPosix(path.relative(PROJECT_ROOT, p)) || ".";
}

function parseFlags(args) {
  const flags = { json: false, top: 0, rest: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--json") flags.json = true;
    else if (a === "--top") { flags.top = parseInt(args[++i], 10) || 0; }
    else if (a.startsWith("--top=")) { flags.top = parseInt(a.slice(6), 10) || 0; }
    else flags.rest.push(a);
  }
  return flags;
}

function usage() {
  return [
    "aihaus-okf code indexer",
    "",
    "Usage:",
    "  node .aihaus-okf/tools/index.mjs status [--json]",
    "  node .aihaus-okf/tools/index.mjs query \"<text>\" [--top N] [--json]",
    "  node .aihaus-okf/tools/index.mjs callers <symbol> [--json]",
    "  node .aihaus-okf/tools/index.mjs impact <path> [--json]",
    "  node .aihaus-okf/tools/index.mjs build",
    "  node .aihaus-okf/tools/index.mjs update [paths...]",
    "",
    "Code only (.md/.json/.yaml and memory/ are never indexed). Semantic via Ollama bge-m3;",
    "lexical fallback otherwise. Data: .aihaus-okf/memory/codebase/ (rebuildable, git-ignored).",
  ].join("\n");
}

async function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const flags = parseFlags(argv.slice(1));

  try {
    switch (command) {
      case "status":
        await cmdStatus(flags.json);
        break;
      case "query":
        await cmdQuery(flags.rest.join(" "), flags.top, flags.json);
        break;
      case "callers":
        await cmdCallers(flags.rest[0], flags.json);
        break;
      case "impact":
        await cmdImpact(flags.rest[0], flags.json);
        break;
      case "build":
        await cmdBuild();
        break;
      case "update":
        await cmdUpdate(flags.rest);
        break;
      case undefined:
      case "help":
      case "--help":
      case "-h":
        process.stdout.write(usage() + "\n");
        break;
      default:
        process.stderr.write(`Unknown command: ${command}\n\n${usage()}\n`);
        process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`error: ${String(error?.stack ?? error?.message ?? error)}\n`);
    process.exitCode = 1;
  }
}

main();
