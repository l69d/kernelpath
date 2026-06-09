"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/*
 * sql.js (SQLite compiled to WebAssembly) is loaded lazily from a CDN at runtime
 * and ships no TypeScript types here. The objects below (the SQL module, the
 * Database instance, and a query result) are therefore typed with narrowly-scoped
 * local interfaces. We only model the tiny surface we actually call, and fall back
 * to `unknown`/narrow `any` ONLY where sql.js hands us untyped values.
 */

// A single result set returned by Database.exec().
interface SqlResult {
  columns: string[];
  // values are SQLite scalars: number | string | Uint8Array | null
  values: SqlValue[][];
}

type SqlValue = number | string | Uint8Array | null;

// Minimal shape of a sql.js Database instance.
interface SqlDatabase {
  run: (sql: string) => void;
  exec: (sql: string) => SqlResult[];
}

// Minimal shape of the sql.js module returned by initSqlJs().
interface SqlModule {
  Database: new () => SqlDatabase;
}

// initSqlJs is attached to window by the CDN script; it is untyped there.
type InitSqlJs = (config: {
  locateFile: (file: string) => string;
}) => Promise<SqlModule>;

const CDN_BASE = "https://sql.js.org/dist/";
const WASM_SCRIPT = CDN_BASE + "sql-wasm.js";

// Seed schema + sample data so JOIN / GROUP BY / subquery examples all work.
const SEED_SQL = `
CREATE TABLE departments (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
INSERT INTO departments (id, name) VALUES
  (1, 'Engineering'),
  (2, 'Sales'),
  (3, 'Marketing'),
  (4, 'Support');

CREATE TABLE employees (
  id      INTEGER PRIMARY KEY,
  name    TEXT NOT NULL,
  dept_id INTEGER REFERENCES departments(id),
  salary  INTEGER NOT NULL
);
INSERT INTO employees (id, name, dept_id, salary) VALUES
  (1, 'Ada Lovelace',     1, 145000),
  (2, 'Linus Torvalds',   1, 160000),
  (3, 'Grace Hopper',     1, 138000),
  (4, 'Alan Turing',      2,  99000),
  (5, 'Margaret Hamilton',2, 112000),
  (6, 'Dennis Ritchie',   3,  87000),
  (7, 'Ken Thompson',     3,  91000),
  (8, 'Barbara Liskov',   4, 104000);
`;

const DEFAULT_QUERY = `SELECT d.name AS department,
       COUNT(*)        AS headcount,
       AVG(e.salary)   AS avg_salary
FROM employees e
JOIN departments d ON d.id = e.dept_id
GROUP BY d.name
ORDER BY avg_salary DESC;`;

interface Example {
  label: string;
  sql: string;
}

const EXAMPLES: Example[] = [
  {
    label: "join + group by",
    sql: DEFAULT_QUERY,
  },
  {
    label: "highest paid",
    sql: `SELECT e.name, d.name AS dept, e.salary
FROM employees e
JOIN departments d ON d.id = e.dept_id
ORDER BY e.salary DESC
LIMIT 3;`,
  },
  {
    label: "above-average earners",
    sql: `SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY salary DESC;`,
  },
  {
    label: "left join (empty dept)",
    sql: `SELECT d.name AS department, COUNT(e.id) AS headcount
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id
GROUP BY d.name
ORDER BY headcount;`,
  },
  {
    label: "total payroll",
    sql: `SELECT SUM(salary) AS total_payroll,
       MAX(salary) AS top_salary,
       MIN(salary) AS lowest_salary
FROM employees;`,
  },
];

type LoadState = "loading" | "ready" | "error";

// Render a SQLite scalar for display.
function cellText(v: SqlValue): string {
  if (v === null) return "NULL";
  if (v instanceof Uint8Array) return `<blob ${v.length}b>`;
  return String(v);
}

// Whether a SQLite scalar is a number (used for column alignment).
function isNumeric(v: SqlValue): boolean {
  return typeof v === "number";
}

// Resolve initSqlJs even if a prior script tag finished loading before this
// effect ran (its "load" event may already have fired). Polls briefly, then
// gives up so the UI can never hang in the loading state forever.
function waitForInitSqlJs(
  getter: () => InitSqlJs | undefined,
  timeoutMs: number,
): Promise<InitSqlJs> {
  return new Promise<InitSqlJs>((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const fn = getter();
      if (fn) {
        resolve(fn);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("sql.js did not register on window"));
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

export default function SqlPlayground() {
  const dbRef = useRef<SqlDatabase | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string>("");

  const [query, setQuery] = useState<string>(DEFAULT_QUERY);
  const [result, setResult] = useState<SqlResult | null>(null);
  const [error, setError] = useState<string>("");
  const [rowsAffected, setRowsAffected] = useState<string>("");

  // Lazily inject the sql.js CDN script and seed the database once.
  useEffect(() => {
    let cancelled = false;

    const seed = (mod: SqlModule) => {
      if (cancelled) return;
      const db = new mod.Database();
      db.run(SEED_SQL);
      dbRef.current = db;
      setLoadState("ready");
    };

    const init = async () => {
      // initSqlJs is attached to window by the CDN script; window is untyped here.
      const win = window as unknown as { initSqlJs?: InitSqlJs };
      try {
        if (!win.initSqlJs) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>(
              `script[src="${WASM_SCRIPT}"]`,
            );
            if (existing) {
              // A tag already exists. It may still be loading, or it may have
              // finished (in which case the "load" event already fired and our
              // listener would never run). Either way, resolve as soon as the
              // tag errors; the post-await poll below handles registration.
              existing.addEventListener("load", () => resolve());
              existing.addEventListener("error", () =>
                reject(new Error("failed to load sql.js script")),
              );
              // Resolve immediately so the poll can detect an already-loaded tag.
              resolve();
              return;
            }
            const script = document.createElement("script");
            script.src = WASM_SCRIPT;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("failed to load sql.js script"));
            document.head.appendChild(script);
          });
        }

        if (cancelled) return;
        // The script tag has loaded, but initSqlJs may register a tick later;
        // poll for it with a bounded timeout instead of failing immediately.
        const initSqlJs = win.initSqlJs
          ? win.initSqlJs
          : await waitForInitSqlJs(() => win.initSqlJs, 15000);
        if (cancelled) return;
        const mod = await initSqlJs({
          locateFile: (file: string) => CDN_BASE + file,
        });
        seed(mod);
      } catch (e) {
        if (cancelled) return;
        setLoadState("error");
        setLoadError(
          e instanceof Error ? e.message : "unknown error loading sql.js",
        );
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const runQuery = () => {
    const db = dbRef.current;
    setError("");
    setRowsAffected("");
    const sql = query.trim();
    if (!sql) {
      setResult(null);
      setError("Enter a SQL statement to run.");
      return;
    }
    if (!db) {
      setError("Database is not ready yet.");
      return;
    }
    try {
      const out = db.exec(sql);
      if (out.length === 0) {
        // Statement(s) that return no rows (INSERT/UPDATE/CREATE/empty SELECT).
        setResult(null);
        setRowsAffected("Statement executed. No rows returned.");
      } else {
        // exec() returns one result set per SELECT; show the last one.
        setResult(out[out.length - 1]);
      }
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "SQL error");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to run, matching common SQL-editor ergonomics.
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      runQuery();
    }
  };

  const rowCount = result ? result.values.length : 0;
  const colCount = result ? result.columns.length : 0;

  // Per-column numeric detection for alignment. Scan down each column for the
  // first non-null cell so a leading NULL (common with LEFT JOIN/aggregates)
  // doesn't misclassify an otherwise-numeric column as text.
  const numericCols = useMemo<boolean[]>(() => {
    if (!result) return [];
    return result.columns.map((_, c) => {
      for (const row of result.values) {
        const cell = row[c];
        if (cell !== null) return isNumeric(cell);
      }
      return false;
    });
  }, [result]);

  return (
    <div className="space-y-5">
      {/* schema reference */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="mono text-[11px] uppercase tracking-widest text-faint">
          schema
        </span>
        <span className="mono text-xs text-muted">
          <span className="text-cyan">employees</span>
          (id, name, dept_id, salary)
        </span>
        <span className="mono text-xs text-muted">
          <span className="text-cyan">departments</span>
          (id, name)
        </span>
        <span
          className="ml-auto mono text-xs rounded px-2.5 py-1 border"
          style={{
            color:
              loadState === "ready"
                ? "#3fb950"
                : loadState === "error"
                  ? "#f85149"
                  : "#e3a93c",
            borderColor:
              (loadState === "ready"
                ? "#3fb950"
                : loadState === "error"
                  ? "#f85149"
                  : "#e3a93c") + "55",
            background:
              (loadState === "ready"
                ? "#3fb950"
                : loadState === "error"
                  ? "#f85149"
                  : "#e3a93c") + "14",
          }}
        >
          {loadState === "ready"
            ? "sqlite ready"
            : loadState === "error"
              ? "load failed"
              : "loading wasm…"}
        </span>
      </div>

      {/* example queries */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mono text-[11px] uppercase tracking-widest text-faint">
          examples
        </span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => {
              setQuery(ex.sql);
              setError("");
              setRowsAffected("");
            }}
            className="mono text-[11px] rounded px-2 py-1 border border-border bg-surface text-muted hover:text-text"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* query editor */}
      <div className="card p-4 space-y-3">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          rows={8}
          className="w-full bg-bg border border-border rounded px-3 py-2.5 mono text-sm text-text outline-none focus:border-faint/50 resize-y leading-relaxed"
          placeholder="SELECT * FROM employees;"
          aria-label="SQL query"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={runQuery}
            disabled={loadState !== "ready"}
            className="mono text-sm font-bold rounded px-4 py-1.5 transition-colors"
            style={{
              background:
                loadState === "ready" ? "var(--color-green)" : "#161c26",
              color: loadState === "ready" ? "#06121a" : "#5b6b7d",
              border: `1px solid ${
                loadState === "ready" ? "var(--color-green)" : "#1e2630"
              }`,
              cursor: loadState === "ready" ? "pointer" : "not-allowed",
            }}
          >
            Run ▸
          </button>
          <span className="mono text-[11px] text-faint">⌘/Ctrl + ⏎</span>
          {loadState === "ready" && result && !error && (
            <span className="ml-auto mono text-xs text-muted">
              {rowCount} row{rowCount === 1 ? "" : "s"} · {colCount} col
              {colCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {/* loading / failure states */}
      {loadState === "loading" && (
        <div className="card p-4 mono text-xs text-muted flex items-center gap-3">
          <span
            className="inline-block rounded-full"
            style={{
              width: 10,
              height: 10,
              background: "#e3a93c",
            }}
          />
          Downloading SQLite WebAssembly from the CDN… this runs entirely in your
          browser.
        </div>
      )}

      {loadState === "error" && (
        <div
          className="card p-4 mono text-xs leading-relaxed"
          style={{ borderColor: "#f8514955", background: "#f8514910" }}
        >
          <div className="font-bold" style={{ color: "#f85149" }}>
            Could not load sql.js
          </div>
          <p className="mt-1 text-muted">
            {loadError || "The WebAssembly bundle failed to download."} This tool
            needs network access to{" "}
            <span className="text-faint">sql.js.org</span> the first time it
            loads. Check your connection and reload the page.
          </p>
        </div>
      )}

      {/* SQL error banner */}
      {error && (
        <div
          className="card p-3 mono text-xs"
          style={{ borderColor: "#f8514955", background: "#f8514910" }}
        >
          <span className="font-bold" style={{ color: "#f85149" }}>
            SQL error:{" "}
          </span>
          <span style={{ color: "#f85149" }}>{error}</span>
        </div>
      )}

      {/* informational (non-SELECT) result */}
      {!error && rowsAffected && (
        <div className="card p-3 mono text-xs text-muted">
          <span className="text-green">✓ </span>
          {rowsAffected}
        </div>
      )}

      {/* results table */}
      {!error && result && (
        <div className="card p-0 overflow-x-auto">
          {result.values.length === 0 ? (
            <div className="p-4 mono text-xs text-faint">
              Query returned 0 rows (columns: {result.columns.join(", ")}).
            </div>
          ) : (
            <table className="w-full border-collapse mono text-xs">
              <thead>
                <tr>
                  {result.columns.map((col, i) => (
                    <th
                      key={i}
                      className="text-left px-3 py-2 uppercase tracking-wider text-[10px] whitespace-nowrap"
                      style={{
                        color: "#39c5e0",
                        borderBottom: "1px solid #1e2630",
                        background: "#161c26",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.values.map((row, r) => (
                  <tr
                    key={r}
                    style={{
                      background: r % 2 === 0 ? "transparent" : "#0c1117",
                    }}
                  >
                    {row.map((v, c) => {
                      const isNull = v === null;
                      return (
                        <td
                          key={c}
                          className="px-3 py-1.5 whitespace-nowrap"
                          style={{
                            borderBottom: "1px solid #161c26",
                            textAlign: numericCols[c] ? "right" : "left",
                            color: isNull
                              ? "#5b6b7d"
                              : numericCols[c]
                                ? "#bc8cff"
                                : "#d6dee8",
                            fontStyle: isNull ? "italic" : "normal",
                          }}
                        >
                          {cellText(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <p className="text-xs text-faint leading-relaxed">
        Real SQLite running in your browser via{" "}
        <span className="text-muted">sql.js</span> (WebAssembly) — no server, no
        network round-trips. The in-memory database resets on page reload, so feel
        free to{" "}
        <span className="text-muted">INSERT</span>,{" "}
        <span className="text-muted">UPDATE</span>, or{" "}
        <span className="text-muted">CREATE TABLE</span> and experiment freely.
      </p>
    </div>
  );
}
