"use client";

import { useMemo, useState } from "react";

type Algo = "FCFS" | "SJF" | "SRTF" | "RR" | "PRIO";

interface Proc {
  pid: number;
  arrival: number;
  burst: number;
  priority: number;
}

// A single contiguous run of the CPU: either a process slice or an idle gap.
interface Segment {
  pid: number | null; // null === idle
  start: number;
  end: number;
}

interface Result {
  pid: number;
  arrival: number;
  burst: number;
  priority: number;
  completion: number;
  turnaround: number;
  waiting: number;
  response: number;
}

interface Schedule {
  segments: Segment[];
  results: Result[];
  makespan: number;
}

const ALGOS: { id: Algo; label: string; note: string }[] = [
  { id: "FCFS", label: "FCFS", note: "First-Come First-Served — runs in arrival order, non-preemptive." },
  { id: "SJF", label: "SJF", note: "Shortest Job First — picks the shortest available burst, non-preemptive." },
  { id: "SRTF", label: "SRTF", note: "Shortest Remaining Time First — preemptive SJF, re-decides every tick." },
  { id: "RR", label: "Round Robin", note: "Time-sliced by the quantum, cycling ready processes in a FIFO queue." },
  { id: "PRIO", label: "Priority", note: "Lowest priority number wins, non-preemptive. FCFS breaks ties." },
];

// A fixed palette so each PID keeps the same colour everywhere.
const PID_COLORS = [
  "#3fb950",
  "#39c5e0",
  "#58a6ff",
  "#bc8cff",
  "#e3a93c",
  "#f778ba",
  "#56d364",
  "#f85149",
];

function colorForPid(pid: number): string {
  // pid is 1-based in the default data; map deterministically into the palette.
  return PID_COLORS[(pid - 1 + PID_COLORS.length) % PID_COLORS.length];
}

const DEFAULT_PROCS: Proc[] = [
  { pid: 1, arrival: 0, burst: 7, priority: 2 },
  { pid: 2, arrival: 2, burst: 4, priority: 1 },
  { pid: 3, arrival: 4, burst: 1, priority: 4 },
  { pid: 4, arrival: 5, burst: 4, priority: 3 },
  { pid: 5, arrival: 8, burst: 3, priority: 2 },
];

// Merge any back-to-back same-pid segments so the Gantt chart stays clean.
function pushSegment(segments: Segment[], pid: number | null, start: number, end: number): void {
  if (end <= start) return;
  const last = segments[segments.length - 1];
  if (last && last.pid === pid && last.end === start) {
    last.end = end;
  } else {
    segments.push({ pid, start, end });
  }
}

function buildResults(
  procs: Proc[],
  finish: Map<number, number>,
  firstStart: Map<number, number>,
): Result[] {
  return procs
    .map((p) => {
      const completion = finish.get(p.pid) ?? p.arrival;
      const turnaround = completion - p.arrival;
      const waiting = turnaround - p.burst;
      const start = firstStart.get(p.pid) ?? p.arrival;
      const response = start - p.arrival;
      return {
        pid: p.pid,
        arrival: p.arrival,
        burst: p.burst,
        priority: p.priority,
        completion,
        turnaround,
        waiting,
        response,
      };
    })
    .sort((a, b) => a.pid - b.pid);
}

function schedule(procs: Proc[], algo: Algo, quantum: number): Schedule {
  const finish = new Map<number, number>();
  const firstStart = new Map<number, number>();
  const segments: Segment[] = [];

  if (algo === "RR") {
    runRoundRobin(procs, quantum, segments, finish, firstStart);
  } else if (algo === "SRTF") {
    runSrtf(procs, segments, finish, firstStart);
  } else {
    runNonPreemptive(procs, algo, segments, finish, firstStart);
  }

  const results = buildResults(procs, finish, firstStart);
  const makespan = segments.length ? segments[segments.length - 1].end : 0;
  return { segments, results, makespan };
}

// Deterministic single-job choice shared by FCFS / SJF / PRIO. Each ranks by its
// own primary key, then breaks ties by earliest arrival, then by lowest pid, so
// the result never depends on the order processes happen to sit in the array.
function pickNonPreemptive(ready: Proc[], algo: Algo): Proc {
  return ready.reduce((best, cand) => {
    if (algo === "SJF") {
      if (cand.burst !== best.burst) return cand.burst < best.burst ? cand : best;
    } else if (algo === "PRIO") {
      if (cand.priority !== best.priority) return cand.priority < best.priority ? cand : best;
    }
    // FCFS overall, plus the tie-break for SJF/PRIO: earliest arrival then pid.
    if (cand.arrival !== best.arrival) return cand.arrival < best.arrival ? cand : best;
    return cand.pid < best.pid ? cand : best;
  });
}

// FCFS / SJF / PRIO share the same skeleton: repeatedly choose one whole job.
function runNonPreemptive(
  procs: Proc[],
  algo: Algo,
  segments: Segment[],
  finish: Map<number, number>,
  firstStart: Map<number, number>,
): void {
  const remaining = [...procs];
  const done = new Set<number>();
  let time = 0;

  while (done.size < procs.length) {
    const ready = remaining.filter((p) => !done.has(p.pid) && p.arrival <= time);

    if (ready.length === 0) {
      // jump to the next arrival, recording the idle gap
      const future = remaining
        .filter((p) => !done.has(p.pid))
        .map((p) => p.arrival);
      const next = Math.min(...future);
      pushSegment(segments, null, time, next);
      time = next;
      continue;
    }

    const pick = pickNonPreemptive(ready, algo);

    if (!firstStart.has(pick.pid)) firstStart.set(pick.pid, time);
    pushSegment(segments, pick.pid, time, time + pick.burst);
    time += pick.burst;
    finish.set(pick.pid, time);
    done.add(pick.pid);
  }
}

function runSrtf(
  procs: Proc[],
  segments: Segment[],
  finish: Map<number, number>,
  firstStart: Map<number, number>,
): void {
  const rem = new Map<number, number>();
  for (const p of procs) rem.set(p.pid, p.burst);
  const done = new Set<number>();
  const total = procs.reduce((s, p) => s + p.burst, 0);

  let time = procs.reduce((m, p) => Math.min(m, p.arrival), Infinity);
  if (!Number.isFinite(time)) time = 0;
  let executed = 0;

  while (executed < total) {
    const ready = procs.filter(
      (p) => !done.has(p.pid) && p.arrival <= time && (rem.get(p.pid) ?? 0) > 0,
    );

    if (ready.length === 0) {
      const future = procs
        .filter((p) => !done.has(p.pid))
        .map((p) => p.arrival)
        .filter((a) => a > time);
      if (future.length === 0) break;
      const next = Math.min(...future);
      pushSegment(segments, null, time, next);
      time = next;
      continue;
    }

    // pick the smallest remaining time; tie-break by arrival then pid
    const pick = ready.reduce((a, b) => {
      const ra = rem.get(a.pid) ?? 0;
      const rb = rem.get(b.pid) ?? 0;
      if (rb < ra) return b;
      if (rb === ra && (b.arrival < a.arrival || (b.arrival === a.arrival && b.pid < a.pid)))
        return b;
      return a;
    });

    if (!firstStart.has(pick.pid)) firstStart.set(pick.pid, time);

    // run one tick, then re-decide (preemptive). For determinism we advance
    // until the next arrival or until this job would finish, whichever is first.
    // A new arrival is the only event that can change which job has the least
    // remaining time, so re-deciding at arrival boundaries is exact.
    const upcoming = procs
      .filter((p) => !done.has(p.pid) && p.arrival > time)
      .map((p) => p.arrival);
    const nextArrival = upcoming.length ? Math.min(...upcoming) : Infinity;
    const left = rem.get(pick.pid) ?? 0;
    const slice = Math.min(left, nextArrival - time);
    const run = slice > 0 ? slice : 1; // guard against zero-length steps

    pushSegment(segments, pick.pid, time, time + run);
    rem.set(pick.pid, left - run);
    time += run;
    executed += run;
    if ((rem.get(pick.pid) ?? 0) <= 0) {
      done.add(pick.pid);
      finish.set(pick.pid, time);
    }
  }
}

function runRoundRobin(
  procs: Proc[],
  quantum: number,
  segments: Segment[],
  finish: Map<number, number>,
  firstStart: Map<number, number>,
): void {
  const q = Math.max(1, Math.floor(quantum));
  const rem = new Map<number, number>();
  for (const p of procs) rem.set(p.pid, p.burst);

  // Process in arrival order; ties broken by pid for determinism.
  const byArrival = [...procs].sort(
    (a, b) => a.arrival - b.arrival || a.pid - b.pid,
  );

  let time = byArrival.length ? byArrival[0].arrival : 0;
  const queue: number[] = [];
  let idx = 0; // next not-yet-enqueued process in byArrival
  const enqueued = new Set<number>();

  const admit = (upTo: number) => {
    while (idx < byArrival.length && byArrival[idx].arrival <= upTo) {
      const pid = byArrival[idx].pid;
      if (!enqueued.has(pid)) {
        queue.push(pid);
        enqueued.add(pid);
      }
      idx++;
    }
  };

  admit(time);

  while (queue.length > 0 || idx < byArrival.length) {
    if (queue.length === 0) {
      // idle until the next arrival
      const next = byArrival[idx].arrival;
      pushSegment(segments, null, time, next);
      time = next;
      admit(time);
      continue;
    }

    const pid = queue.shift() as number;
    const left = rem.get(pid) ?? 0;
    if (left <= 0) continue;

    if (!firstStart.has(pid)) firstStart.set(pid, time);
    const run = Math.min(q, left);
    pushSegment(segments, pid, time, time + run);
    time += run;
    rem.set(pid, left - run);

    // Admit everyone who arrived during this slice BEFORE re-queueing the
    // current process — the classic RR convention.
    admit(time);

    if ((rem.get(pid) ?? 0) > 0) {
      queue.push(pid);
    } else {
      finish.set(pid, time);
    }
  }
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export default function Scheduler() {
  const [procs, setProcs] = useState<Proc[]>(DEFAULT_PROCS);
  const [algo, setAlgo] = useState<Algo>("FCFS");
  const [quantum, setQuantum] = useState<number>(2);

  const { valid, error } = useMemo(() => {
    if (procs.length === 0)
      return { valid: false, error: "Add at least one process to schedule." };
    for (const p of procs) {
      if (!Number.isFinite(p.arrival) || p.arrival < 0)
        return { valid: false, error: `P${p.pid}: arrival time must be ≥ 0.` };
      if (!Number.isFinite(p.burst) || p.burst <= 0)
        return { valid: false, error: `P${p.pid}: burst time must be > 0.` };
    }
    if (algo === "RR" && (!Number.isFinite(quantum) || quantum < 1))
      return { valid: false, error: "Round Robin quantum must be ≥ 1." };
    return { valid: true, error: "" };
  }, [procs, algo, quantum]);

  const data: Schedule = useMemo(() => {
    if (!valid) return { segments: [], results: [], makespan: 0 };
    return schedule(procs, algo, quantum);
  }, [procs, algo, quantum, valid]);

  const avgTurnaround = avg(data.results.map((r) => r.turnaround));
  const avgWaiting = avg(data.results.map((r) => r.waiting));
  const avgResponse = avg(data.results.map((r) => r.response));

  const updateProc = (pid: number, field: keyof Proc, raw: string) => {
    const n = Math.floor(Number(raw));
    setProcs((prev) =>
      prev.map((p) =>
        p.pid === pid ? { ...p, [field]: Number.isFinite(n) ? n : 0 } : p,
      ),
    );
  };

  const addProc = () => {
    setProcs((prev) => {
      const nextPid = prev.reduce((m, p) => Math.max(m, p.pid), 0) + 1;
      return [...prev, { pid: nextPid, arrival: 0, burst: 3, priority: 1 }];
    });
  };

  const removeProc = (pid: number) => {
    setProcs((prev) => prev.filter((p) => p.pid !== pid));
  };

  const reset = () => setProcs(DEFAULT_PROCS);

  // Gantt geometry — scale time to pixels, clamped so it stays readable.
  const span = Math.max(1, data.makespan);
  const pxPerUnit = Math.max(14, Math.min(48, Math.round(640 / span)));

  return (
    <div className="space-y-6">
      {/* algorithm selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mono text-[11px] uppercase tracking-widest text-faint">
          algorithm
        </span>
        {ALGOS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAlgo(a.id)}
            className="mono text-xs rounded px-3 py-1 border transition-colors"
            style={{
              background: algo === a.id ? "var(--color-green)" : "transparent",
              color: algo === a.id ? "#06121a" : "var(--color-muted)",
              borderColor: algo === a.id ? "var(--color-green)" : "var(--color-border)",
            }}
          >
            {a.label}
          </button>
        ))}
        {algo === "RR" && (
          <label className="mono text-xs text-muted flex items-center gap-2 ml-1">
            quantum =
            <input
              type="number"
              min={1}
              value={quantum}
              onChange={(e) => setQuantum(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              className="w-16 bg-surface border border-border rounded px-2 py-1 mono text-sm text-text outline-none focus:border-faint/50"
            />
          </label>
        )}
        <span className="ml-auto mono text-[11px] text-faint hidden sm:block">
          {ALGOS.find((a) => a.id === algo)?.note}
        </span>
      </div>

      {/* process editor */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="mono text-[10px] uppercase tracking-widest text-faint">
            processes
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={addProc}
              className="mono text-[11px] rounded px-2 py-1 border border-border bg-surface text-muted hover:text-text"
            >
              + add
            </button>
            <button
              onClick={reset}
              className="mono text-[11px] rounded px-2 py-1 border border-border bg-surface text-muted hover:text-text"
            >
              reset
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max mono text-xs">
            <thead>
              <tr className="text-faint">
                <th className="text-left font-normal uppercase tracking-wider text-[10px] pb-2 pr-3">
                  pid
                </th>
                <th className="text-left font-normal uppercase tracking-wider text-[10px] pb-2 pr-3">
                  arrival
                </th>
                <th className="text-left font-normal uppercase tracking-wider text-[10px] pb-2 pr-3">
                  burst
                </th>
                <th className="text-left font-normal uppercase tracking-wider text-[10px] pb-2 pr-3">
                  priority
                </th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {procs.map((p) => (
                <tr key={p.pid} className="border-t border-border">
                  <td className="py-1.5 pr-3">
                    <span
                      className="inline-flex items-center gap-1.5 font-bold"
                      style={{ color: colorForPid(p.pid) }}
                    >
                      <span
                        className="inline-block rounded-sm"
                        style={{ width: 10, height: 10, background: colorForPid(p.pid) }}
                      />
                      P{p.pid}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3">
                    <input
                      type="number"
                      min={0}
                      value={p.arrival}
                      onChange={(e) => updateProc(p.pid, "arrival", e.target.value)}
                      className="w-16 bg-surface border border-border rounded px-2 py-1 mono text-xs text-text outline-none focus:border-faint/50"
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <input
                      type="number"
                      min={1}
                      value={p.burst}
                      onChange={(e) => updateProc(p.pid, "burst", e.target.value)}
                      className="w-16 bg-surface border border-border rounded px-2 py-1 mono text-xs text-text outline-none focus:border-faint/50"
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <input
                      type="number"
                      value={p.priority}
                      onChange={(e) => updateProc(p.pid, "priority", e.target.value)}
                      className="w-16 bg-surface border border-border rounded px-2 py-1 mono text-xs text-text outline-none focus:border-faint/50"
                    />
                  </td>
                  <td className="py-1.5">
                    <button
                      onClick={() => removeProc(p.pid)}
                      className="mono text-[11px] rounded px-2 py-1 border border-border bg-surface text-faint hover:text-red"
                      title="remove process"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {algo !== "PRIO" && (
          <p className="mt-2 text-[10px] text-faint mono">
            priority is only used by the Priority algorithm — lower number = higher priority.
          </p>
        )}
      </div>

      {error ? (
        <div
          className="card p-4 mono text-xs"
          style={{ color: "#f85149", borderColor: "#f8514955" }}
        >
          {error}
        </div>
      ) : (
        <>
          {/* gantt chart */}
          <div className="card p-4 overflow-x-auto">
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-3">
              gantt chart
            </div>
            <div className="min-w-max">
              <div className="flex">
                {data.segments.map((seg, i) => {
                  const w = (seg.end - seg.start) * pxPerUnit;
                  const idle = seg.pid === null;
                  const color = idle ? "#1e2630" : colorForPid(seg.pid as number);
                  return (
                    <div
                      key={i}
                      className="grid place-items-center mono text-xs font-bold"
                      style={{
                        width: w,
                        height: 40,
                        background: idle ? "transparent" : color + "26",
                        color: idle ? "#5b6b7d" : color,
                        border: `1px solid ${idle ? "#1e2630" : color}`,
                        borderStyle: idle ? "dashed" : "solid",
                        marginLeft: i === 0 ? 0 : -1,
                      }}
                      title={
                        idle
                          ? `idle ${seg.start}–${seg.end}`
                          : `P${seg.pid}: ${seg.start}–${seg.end}`
                      }
                    >
                      {idle ? "idle" : `P${seg.pid}`}
                    </div>
                  );
                })}
              </div>
              {/* time axis ticks */}
              <div className="relative mt-1" style={{ height: 16 }}>
                {data.segments.length > 0 && (
                  <>
                    {(() => {
                      const ticks: number[] = [];
                      for (const seg of data.segments) {
                        if (!ticks.includes(seg.start)) ticks.push(seg.start);
                        if (!ticks.includes(seg.end)) ticks.push(seg.end);
                      }
                      ticks.sort((a, b) => a - b);
                      const origin = ticks[0] ?? 0;
                      return ticks.map((t) => (
                        <span
                          key={t}
                          className="absolute mono text-[10px] text-faint"
                          style={{ left: (t - origin) * pxPerUnit, transform: "translateX(-50%)" }}
                        >
                          {t}
                        </span>
                      ));
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* per-process results */}
          <div className="card p-4 overflow-x-auto">
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-3">
              results
            </div>
            <table className="w-full min-w-max mono text-xs">
              <thead>
                <tr className="text-faint">
                  {["pid", "arrival", "burst", "completion", "turnaround", "waiting", "response"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-right first:text-left font-normal uppercase tracking-wider text-[10px] pb-2 px-3"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.results.map((r) => (
                  <tr key={r.pid} className="border-t border-border">
                    <td className="py-1.5 px-3">
                      <span className="font-bold" style={{ color: colorForPid(r.pid) }}>
                        P{r.pid}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right text-muted">{r.arrival}</td>
                    <td className="py-1.5 px-3 text-right text-muted">{r.burst}</td>
                    <td className="py-1.5 px-3 text-right text-text">{r.completion}</td>
                    <td className="py-1.5 px-3 text-right" style={{ color: "#39c5e0" }}>
                      {r.turnaround}
                    </td>
                    <td className="py-1.5 px-3 text-right" style={{ color: "#e3a93c" }}>
                      {r.waiting}
                    </td>
                    <td className="py-1.5 px-3 text-right" style={{ color: "#bc8cff" }}>
                      {r.response}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td className="py-2 px-3 text-faint uppercase tracking-wider text-[10px]">
                    average
                  </td>
                  <td />
                  <td />
                  <td />
                  <td className="py-2 px-3 text-right font-bold" style={{ color: "#39c5e0" }}>
                    {fmt(avgTurnaround)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold" style={{ color: "#e3a93c" }}>
                    {fmt(avgWaiting)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold" style={{ color: "#bc8cff" }}>
                    {fmt(avgResponse)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* summary cells */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Cell label="avg turnaround" value={fmt(avgTurnaround)} color="#39c5e0" />
            <Cell label="avg waiting" value={fmt(avgWaiting)} color="#e3a93c" />
            <Cell label="avg response" value={fmt(avgResponse)} color="#bc8cff" />
            <Cell label="makespan" value={String(data.makespan)} color="#3fb950" />
          </div>

          <p className="mono text-[11px] text-faint leading-relaxed">
            turnaround = completion − arrival&nbsp;&nbsp;·&nbsp;&nbsp;waiting = turnaround − burst
            &nbsp;&nbsp;·&nbsp;&nbsp;response = first-run − arrival. Switch algorithms above to
            watch the same workload reorder.
          </p>
        </>
      )}
    </div>
  );
}

function Cell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-lg font-bold mt-1 truncate" style={{ color }} title={value}>
        {value}
      </div>
    </div>
  );
}