"use client";

import { useEffect, useRef, useState } from "react";

interface LogLine {
  level: "log" | "error" | "warn";
  text: string;
}

const WORKER_SRC = `
self.onmessage = function (e) {
  function fmt(v) {
    if (typeof v === 'string') return v;
    if (typeof v === 'function') return v.toString();
    try { return JSON.stringify(v, null, 0); } catch (_) { return String(v); }
  }
  function send(level, args) {
    self.postMessage({ type: 'log', level: level, text: Array.prototype.map.call(args, fmt).join(' ') });
  }
  var sandboxConsole = {
    log: function () { send('log', arguments); },
    info: function () { send('log', arguments); },
    warn: function () { send('warn', arguments); },
    error: function () { send('error', arguments); },
    debug: function () { send('log', arguments); },
  };
  try {
    var fn = new Function('console', e.data);
    var ret = fn(sandboxConsole);
    if (ret !== undefined) send('log', ['=> ' + fmt(ret)]);
    self.postMessage({ type: 'done' });
  } catch (err) {
    self.postMessage({ type: 'log', level: 'error', text: String(err && err.stack ? err.stack : err) });
    self.postMessage({ type: 'done' });
  }
};
`;

const PRESETS: { name: string; code: string }[] = [
  {
    name: "Fibonacci (recursion)",
    code: `// Recursion: the classic
function fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}
for (let i = 0; i < 10; i++) console.log(i, "->", fib(i));`,
  },
  {
    name: "Closures & counters",
    code: `// A closure captures its environment
function makeCounter() {
  let count = 0;
  return () => ++count;
}
const next = makeCounter();
console.log(next(), next(), next()); // 1 2 3`,
  },
  {
    name: "Quicksort",
    code: `// Divide and conquer
function quicksort(a) {
  if (a.length <= 1) return a;
  const [p, ...rest] = a;
  const lo = rest.filter(x => x < p);
  const hi = rest.filter(x => x >= p);
  return [...quicksort(lo), p, ...quicksort(hi)];
}
console.log(quicksort([5, 2, 9, 1, 7, 3]));`,
  },
  {
    name: "Map / filter / reduce",
    code: `// Functional pipeline
const nums = [1,2,3,4,5,6,7,8,9,10];
const result = nums
  .filter(n => n % 2 === 0)
  .map(n => n * n)
  .reduce((a, b) => a + b, 0);
console.log("sum of squares of evens:", result);`,
  },
  {
    name: "Hash collisions",
    code: `// Watch a tiny hash table collide
const SIZE = 7;
const hash = s => [...s].reduce((h,c)=> (h*31 + c.charCodeAt(0)) % SIZE, 0);
for (const word of ["cat","dog","bird","fish","ant","bee"])
  console.log(word, "-> bucket", hash(word));`,
  },
];

export default function JsPlayground() {
  const [code, setCode] = useState(PRESETS[0].code);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const stop = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    setRunning(false);
  };

  const run = () => {
    stop();
    setLogs([]);
    setRunning(true);
    let url: string;
    try {
      const blob = new Blob([WORKER_SRC], { type: "application/javascript" });
      url = URL.createObjectURL(blob);
    } catch {
      setLogs([{ level: "error", text: "Web Workers are unavailable in this browser." }]);
      setRunning(false);
      return;
    }
    const worker = new Worker(url);
    workerRef.current = worker;

    const finish = (extra?: LogLine) => {
      if (extra) setLogs((l) => [...l, extra]);
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      if (timerRef.current) clearTimeout(timerRef.current);
      URL.revokeObjectURL(url);
      setRunning(false);
    };

    worker.onmessage = (e: MessageEvent) => {
      const d = e.data;
      if (d.type === "log") {
        setLogs((l) => [...l, { level: d.level, text: d.text }]);
      } else if (d.type === "done") {
        finish();
      }
    };
    worker.onerror = (err) => finish({ level: "error", text: err.message });

    timerRef.current = setTimeout(() => {
      finish({ level: "error", text: "⏱ Execution timed out (2s) — possible infinite loop. Terminated." });
    }, 2000);

    worker.postMessage(code);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          onChange={(e) => {
            const p = PRESETS.find((x) => x.name === e.target.value);
            if (p) setCode(p.code);
          }}
          className="bg-surface border border-border rounded px-3 py-1.5 text-sm text-text outline-none"
          defaultValue={PRESETS[0].name}
        >
          {PRESETS.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={run}
          disabled={running}
          className="rounded-lg bg-green px-4 py-1.5 font-semibold text-sm text-[#06121a] hover:bg-green-bright disabled:opacity-50 transition-colors"
        >
          {running ? "running…" : "▶ Run"}
        </button>
        {running && (
          <button
            onClick={() => stop()}
            className="rounded-lg border border-red/40 bg-red/5 px-3 py-1.5 text-sm text-red"
          >
            ■ Stop
          </button>
        )}
        <button
          onClick={() => setLogs([])}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-text"
        >
          clear
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="min-h-[320px] w-full rounded-lg border border-border bg-[#0a0e14] p-4 mono text-[13px] leading-relaxed text-text outline-none focus:border-faint/50 resize-y"
        />
        <div className="min-h-[320px] rounded-lg border border-border bg-[#0a0e14] p-4 mono text-[13px] leading-relaxed overflow-auto">
          {logs.length === 0 ? (
            <span className="text-faint">// output appears here — runs in a sandboxed worker</span>
          ) : (
            logs.map((l, i) => (
              <div
                key={i}
                className="whitespace-pre-wrap break-words"
                style={{
                  color:
                    l.level === "error"
                      ? "var(--color-red)"
                      : l.level === "warn"
                        ? "var(--color-amber)"
                        : "var(--color-text)",
                }}
              >
                {l.text}
              </div>
            ))
          )}
        </div>
      </div>
      <p className="text-xs text-faint">
        Runs JavaScript in an isolated Web Worker with a 2-second timeout. Use{" "}
        <code className="mono">console.log(...)</code> to print. Nothing leaves
        your browser.
      </p>
    </div>
  );
}
