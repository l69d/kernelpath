"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Frame {
  arr: number[];
  active: number[];
  sorted: number[];
}

const N = 22;

function randomArray(n: number): number[] {
  const a: number[] = [];
  for (let i = 0; i < n; i++) a.push(Math.floor(Math.random() * 95) + 5);
  return a;
}

function bubble(input: number[]): Frame[] {
  const arr = [...input];
  const f: Frame[] = [];
  const sorted: number[] = [];
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      f.push({ arr: [...arr], active: [j, j + 1], sorted: [...sorted] });
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        f.push({ arr: [...arr], active: [j, j + 1], sorted: [...sorted] });
      }
    }
    sorted.push(n - i - 1);
  }
  f.push({ arr: [...arr], active: [], sorted: arr.map((_, k) => k) });
  return f;
}

function selection(input: number[]): Frame[] {
  const arr = [...input];
  const f: Frame[] = [];
  const sorted: number[] = [];
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      f.push({ arr: [...arr], active: [min, j], sorted: [...sorted] });
      if (arr[j] < arr[min]) min = j;
    }
    if (min !== i) [arr[i], arr[min]] = [arr[min], arr[i]];
    sorted.push(i);
    f.push({ arr: [...arr], active: [i], sorted: [...sorted] });
  }
  return f;
}

function insertion(input: number[]): Frame[] {
  const arr = [...input];
  const f: Frame[] = [];
  const n = arr.length;
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      const sorted = Array.from({ length: i }, (_, k) => k);
      f.push({ arr: [...arr], active: [j - 1, j], sorted });
      if (arr[j - 1] > arr[j]) {
        [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
        j--;
      } else break;
    }
  }
  f.push({ arr: [...arr], active: [], sorted: arr.map((_, k) => k) });
  return f;
}

function quick(input: number[]): Frame[] {
  const arr = [...input];
  const f: Frame[] = [];
  const sorted: number[] = [];
  const qs = (lo: number, hi: number) => {
    if (lo > hi) return;
    if (lo === hi) {
      sorted.push(lo);
      return;
    }
    const pivot = arr[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      f.push({ arr: [...arr], active: [j, hi], sorted: [...sorted] });
      if (arr[j] < pivot) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        i++;
        f.push({ arr: [...arr], active: [i - 1, j], sorted: [...sorted] });
      }
    }
    [arr[i], arr[hi]] = [arr[hi], arr[i]];
    sorted.push(i);
    f.push({ arr: [...arr], active: [i], sorted: [...sorted] });
    qs(lo, i - 1);
    qs(i + 1, hi);
  };
  qs(0, arr.length - 1);
  f.push({ arr: [...arr], active: [], sorted: arr.map((_, k) => k) });
  return f;
}

function merge(input: number[]): Frame[] {
  const arr = [...input];
  const f: Frame[] = [];
  const ms = (lo: number, hi: number) => {
    if (hi - lo < 1) return;
    const mid = (lo + hi) >> 1;
    ms(lo, mid);
    ms(mid + 1, hi);
    const tmp: number[] = [];
    let i = lo;
    let j = mid + 1;
    while (i <= mid && j <= hi) {
      f.push({ arr: [...arr], active: [i, j], sorted: [] });
      if (arr[i] <= arr[j]) tmp.push(arr[i++]);
      else tmp.push(arr[j++]);
    }
    while (i <= mid) tmp.push(arr[i++]);
    while (j <= hi) tmp.push(arr[j++]);
    for (let k = 0; k < tmp.length; k++) {
      arr[lo + k] = tmp[k];
      f.push({ arr: [...arr], active: [lo + k], sorted: [] });
    }
  };
  ms(0, arr.length - 1);
  f.push({ arr: [...arr], active: [], sorted: arr.map((_, k) => k) });
  return f;
}

const ALGOS: Record<string, { fn: (a: number[]) => Frame[]; complexity: string }> = {
  "Bubble sort": { fn: bubble, complexity: "O(n²)" },
  "Insertion sort": { fn: insertion, complexity: "O(n²)" },
  "Selection sort": { fn: selection, complexity: "O(n²)" },
  "Quicksort": { fn: quick, complexity: "O(n log n) avg" },
  "Merge sort": { fn: merge, complexity: "O(n log n)" },
};

export default function SortingViz() {
  const [algo, setAlgo] = useState("Quicksort");
  const [base, setBase] = useState<number[]>(() => randomArray(N));
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(60);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const frames = useMemo(() => ALGOS[algo].fn(base), [algo, base]);
  const frame = frames[Math.min(idx, frames.length - 1)];

  const clear = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    clear();
    if (!playing) return;
    timer.current = setInterval(() => {
      setIdx((i) => {
        if (i >= frames.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 110 - speed);
    return clear;
  }, [playing, speed, frames.length, clear]);

  // reset position when algorithm or data changes
  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [algo, base]);

  const shuffle = () => {
    setBase(randomArray(N));
  };

  const max = Math.max(...frame.arr);
  const done = idx >= frames.length - 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={algo}
          onChange={(e) => setAlgo(e.target.value)}
          className="bg-surface border border-border rounded px-3 py-1.5 text-sm text-text outline-none"
        >
          {Object.keys(ALGOS).map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <span className="mono text-xs rounded px-2 py-1 bg-cyan/10 text-cyan border border-cyan/30">
          {ALGOS[algo].complexity}
        </span>
        <button
          onClick={() => {
            if (done) setIdx(0);
            setPlaying((p) => !p);
          }}
          className="rounded-lg bg-green px-4 py-1.5 font-semibold text-sm text-[#06121a] hover:bg-green-bright transition-colors"
        >
          {playing ? "❚❚ pause" : done ? "↻ replay" : "▶ play"}
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setIdx((i) => Math.min(i + 1, frames.length - 1));
          }}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-text"
        >
          step →
        </button>
        <button
          onClick={shuffle}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-text"
        >
          shuffle
        </button>
        <label className="ml-auto flex items-center gap-2 mono text-[11px] text-faint">
          speed
          <input
            type="range"
            min={10}
            max={100}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="accent-[#3fb950]"
          />
        </label>
      </div>

      <div className="card p-4">
        <div className="flex items-end justify-center gap-1 h-64">
          {frame.arr.map((v, i) => {
            const isActive = frame.active.includes(i);
            const isSorted = frame.sorted.includes(i);
            const color = isActive
              ? "#e3a93c"
              : isSorted
                ? "#3fb950"
                : "#39c5e0";
            return (
              <div
                key={i}
                className="flex-1 rounded-t transition-[height] duration-75"
                style={{
                  height: `${(v / max) * 100}%`,
                  background: color,
                  boxShadow: isActive ? `0 0 12px -2px ${color}` : undefined,
                  maxWidth: 24,
                }}
                title={String(v)}
              />
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between mono text-[11px] text-faint">
          <span>
            step {Math.min(idx + 1, frames.length)} / {frames.length}
          </span>
          <span className="flex items-center gap-3">
            <Legend color="#39c5e0" label="unsorted" />
            <Legend color="#e3a93c" label="comparing" />
            <Legend color="#3fb950" label="sorted" />
          </span>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block h-2 w-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
