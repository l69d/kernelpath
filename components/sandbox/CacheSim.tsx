"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 *  Cache Simulator — replay an address stream against a configurable
 *  cache (sets x ways) and watch hits / misses / LRU evictions live.
 *  Fixed 8-bit address space.  Pure, deterministic, no external deps.
 * ------------------------------------------------------------------ */

const ADDR_BITS = 8; // address space width (0..255)

type Outcome = "hit" | "miss" | "evict";

// A single way (cache line) inside a set.
interface Line {
  valid: boolean;
  tag: number;
  lru: number; // age counter: 0 = most-recently used, higher = older
}

// One decoded access against the cache.
interface AccessLog {
  addr: number;
  tag: number;
  index: number;
  offset: number;
  outcome: Outcome;
  way: number; // way that served / was filled
  evictedTag: number | null; // tag thrown out on an evict, else null
}

interface SimState {
  sets: Line[][]; // [setIndex][way]
  log: AccessLog[];
  hits: number;
  misses: number;
}

const COLORS = {
  hit: "#3fb950",
  miss: "#e3a93c",
  evict: "#f85149",
} as const;

function log2(n: number): number {
  return Math.round(Math.log2(n));
}

// Build a clean cache given the geometry.
function freshSets(numSets: number, ways: number): Line[][] {
  const out: Line[][] = [];
  for (let s = 0; s < numSets; s++) {
    const row: Line[] = [];
    for (let w = 0; w < ways; w++) row.push({ valid: false, tag: 0, lru: 0 });
    out.push(row);
  }
  return out;
}

// Decode an address into tag | index | offset for the current geometry.
function decode(addr: number, offsetBits: number, indexBits: number) {
  const masked = addr & ((1 << ADDR_BITS) - 1);
  const offset = masked & ((1 << offsetBits) - 1);
  const index = indexBits === 0 ? 0 : (masked >> offsetBits) & ((1 << indexBits) - 1);
  const tag = masked >> (offsetBits + indexBits);
  return { masked, offset, index, tag };
}

// Apply one access to a cache state, returning the next state. Pure.
function applyAccess(
  state: SimState,
  addr: number,
  offsetBits: number,
  indexBits: number,
  ways: number,
): SimState {
  const { masked, offset, index, tag } = decode(addr, offsetBits, indexBits);
  // Deep-copy the touched set only; share the rest by reference for speed.
  const sets = state.sets.map((row, s) =>
    s === index ? row.map((l) => ({ ...l })) : row,
  );
  const set = sets[index];

  let outcome: Outcome;
  let usedWay = 0;
  let evictedTag: number | null = null;

  // Hit?
  const hitWay = set.findIndex((l) => l.valid && l.tag === tag);
  if (hitWay !== -1) {
    outcome = "hit";
    usedWay = hitWay;
  } else {
    // Miss — find an empty way, else evict the LRU (largest lru age).
    const emptyWay = set.findIndex((l) => !l.valid);
    if (emptyWay !== -1) {
      outcome = "miss";
      usedWay = emptyWay;
    } else {
      outcome = "evict";
      let victim = 0;
      for (let w = 1; w < set.length; w++) {
        if (set[w].lru > set[victim].lru) victim = w;
      }
      usedWay = victim;
      evictedTag = set[victim].tag;
    }
    set[usedWay] = { valid: true, tag, lru: 0 };
  }

  // LRU bookkeeping: age every other valid line, reset the used one to 0.
  for (let w = 0; w < set.length; w++) {
    if (w === usedWay) {
      set[w].lru = 0;
    } else if (set[w].valid) {
      set[w].lru += 1;
    }
  }

  const entry: AccessLog = {
    addr: masked,
    tag,
    index,
    offset,
    outcome,
    way: usedWay,
    evictedTag,
  };

  return {
    sets,
    log: [...state.log, entry],
    hits: state.hits + (outcome === "hit" ? 1 : 0),
    misses: state.misses + (outcome === "hit" ? 0 : 1),
  };
}

// Parse the editable stream into clean 8-bit addresses + a problem report.
function parseStream(raw: string): { addrs: number[]; error: string | null } {
  const tokens = raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tokens.length === 0) {
    return { addrs: [], error: "Stream is empty — add some addresses." };
  }
  const addrs: number[] = [];
  for (const t of tokens) {
    const n = t.toLowerCase().startsWith("0x") ? parseInt(t, 16) : Number(t);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      return { addrs: [], error: `"${t}" is not a whole number.` };
    }
    if (n < 0 || n > (1 << ADDR_BITS) - 1) {
      return {
        addrs: [],
        error: `"${t}" is outside the ${ADDR_BITS}-bit address range (0–${(1 << ADDR_BITS) - 1}).`,
      };
    }
    addrs.push(n);
  }
  return { addrs, error: null };
}

const SET_OPTIONS = [1, 2, 4, 8] as const;
const WAY_OPTIONS = [1, 2, 4] as const;
const BLOCK_OPTIONS = [1, 2, 4] as const;

export default function CacheSim() {
  const [numSets, setNumSets] = useState<number>(4);
  const [ways, setWays] = useState<number>(2);
  const [blockSize, setBlockSize] = useState<number>(2);
  const [streamText, setStreamText] = useState<string>(
    "0, 4, 8, 0, 32, 4, 8, 0, 16, 32, 4, 64",
  );
  const [running, setRunning] = useState<boolean>(false);

  // Derived bit widths from the geometry over a fixed 8-bit address space.
  const offsetBits = log2(blockSize);
  const indexBits = log2(numSets);
  const tagBits = ADDR_BITS - offsetBits - indexBits;

  const { addrs, error } = useMemo(() => parseStream(streamText), [streamText]);

  // The cache state is fully determined by config + how many accesses we've
  // replayed (pos). We rebuild from scratch each time so it stays correct.
  const [pos, setPos] = useState<number>(0);

  const state = useMemo<SimState>(() => {
    let st: SimState = {
      sets: freshSets(numSets, ways),
      log: [],
      hits: 0,
      misses: 0,
    };
    const upTo = Math.min(pos, addrs.length);
    for (let i = 0; i < upTo; i++) {
      st = applyAccess(st, addrs[i], offsetBits, indexBits, ways);
    }
    return st;
  }, [numSets, ways, addrs, pos, offsetBits, indexBits]);

  // Reset replay position whenever the geometry or the stream changes.
  useEffect(() => {
    setPos(0);
    setRunning(false);
  }, [numSets, ways, blockSize, streamText]);

  // Auto-run timer.
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!running) return;
    if (error || pos >= addrs.length) {
      setRunning(false);
      return;
    }
    timer.current = setInterval(() => {
      setPos((p) => {
        if (p >= addrs.length) {
          setRunning(false);
          return p;
        }
        return p + 1;
      });
    }, 650);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running, error, addrs.length, pos]);

  const total = state.hits + state.misses;
  const hitRate = total === 0 ? 0 : (state.hits / total) * 100;
  const last = state.log.length > 0 ? state.log[state.log.length - 1] : null;
  const done = !error && pos >= addrs.length && addrs.length > 0;

  const step = () => {
    if (error || pos >= addrs.length) return;
    setPos((p) => Math.min(p + 1, addrs.length));
  };
  const reset = () => {
    setPos(0);
    setRunning(false);
  };

  // The address that WILL be processed next (preview), if any.
  const nextAddr = !error && pos < addrs.length ? addrs[pos] : null;
  const nextDecoded =
    nextAddr !== null ? decode(nextAddr, offsetBits, indexBits) : null;

  return (
    <div className="space-y-5">
      {/* config bar */}
      <div className="card p-4 space-y-3">
        <ConfigRow label="sets">
          {SET_OPTIONS.map((n) => (
            <Pill key={n} active={numSets === n} onClick={() => setNumSets(n)}>
              {n}
            </Pill>
          ))}
        </ConfigRow>
        <ConfigRow label="ways (assoc)">
          {WAY_OPTIONS.map((n) => (
            <Pill key={n} active={ways === n} onClick={() => setWays(n)}>
              {n === 1 ? "1 (direct)" : `${n}-way`}
            </Pill>
          ))}
        </ConfigRow>
        <ConfigRow label="block bytes">
          {BLOCK_OPTIONS.map((n) => (
            <Pill key={n} active={blockSize === n} onClick={() => setBlockSize(n)}>
              {n}
            </Pill>
          ))}
        </ConfigRow>
        <div className="flex flex-wrap gap-2 pt-1 mono text-[10px]">
          <BitTag color="#bc8cff" label={`tag · ${tagBits} bit`} />
          <BitTag color="#39c5e0" label={`index · ${indexBits} bit`} />
          <BitTag color="#e3a93c" label={`offset · ${offsetBits} bit`} />
          <span className="ml-auto text-faint self-center">
            {ADDR_BITS}-bit addresses · {numSets * ways} lines · {numSets * ways * blockSize} B
          </span>
        </div>
      </div>

      {/* stream + controls */}
      <div className="card p-4 space-y-3">
        <div className="mono text-[10px] uppercase tracking-widest text-faint">
          address reference stream (comma / space separated, decimal or 0x)
        </div>
        <textarea
          value={streamText}
          onChange={(e) => setStreamText(e.target.value)}
          rows={2}
          spellCheck={false}
          className="w-full bg-surface border border-border rounded px-3 py-2 mono text-sm text-text outline-none focus:border-faint/50 resize-none"
          placeholder="e.g. 0, 4, 8, 0, 32"
        />
        {error ? (
          <div
            className="mono text-xs rounded px-3 py-2 border"
            style={{ color: COLORS.evict, borderColor: COLORS.evict + "55", background: COLORS.evict + "14" }}
          >
            {error}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={step}
              disabled={done}
              className="mono text-xs rounded px-3 py-1.5 border border-border bg-surface text-text disabled:opacity-40 disabled:cursor-not-allowed hover:border-faint/50"
            >
              Step ▸
            </button>
            <button
              onClick={() => setRunning((r) => !r)}
              disabled={done}
              className="mono text-xs rounded px-3 py-1.5 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: running ? "var(--color-amber)" : "var(--color-green)",
                color: "#06121a",
                borderColor: running ? "var(--color-amber)" : "var(--color-green)",
              }}
            >
              {running ? "Pause ❚❚" : "Run ▶▶"}
            </button>
            <button
              onClick={reset}
              className="mono text-xs rounded px-3 py-1.5 border border-border bg-surface text-muted hover:text-text"
            >
              Reset ↺
            </button>
            <span className="ml-auto mono text-xs text-faint">
              access {Math.min(pos, addrs.length)} / {addrs.length}
              {done && " · done"}
            </span>
          </div>
        )}
      </div>

      {/* readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Cell label="hits" value={String(state.hits)} color="#3fb950" />
        <Cell label="misses" value={String(state.misses)} color="#e3a93c" />
        <Cell label="hit rate" value={total === 0 ? "—" : hitRate.toFixed(1) + "%"} color="#39c5e0" />
        <Cell
          label="last result"
          value={last ? last.outcome.toUpperCase() : "—"}
          color={last ? COLORS[last.outcome] : "#5b6b7d"}
        />
      </div>

      {/* current / next address decomposition */}
      <div className="card p-4">
        <div className="mono text-[10px] uppercase tracking-widest text-faint mb-3">
          {nextDecoded ? "next access" : last ? "last access" : "address decomposition"}
        </div>
        {nextDecoded ? (
          <AddrSplit
            addr={nextAddr as number}
            tag={nextDecoded.tag}
            index={nextDecoded.index}
            offset={nextDecoded.offset}
            tagBits={tagBits}
            indexBits={indexBits}
            offsetBits={offsetBits}
            note={`will probe set ${nextDecoded.index} for tag ${nextDecoded.tag}`}
            noteColor="#8a97a8"
          />
        ) : last ? (
          <AddrSplit
            addr={last.addr}
            tag={last.tag}
            index={last.index}
            offset={last.offset}
            tagBits={tagBits}
            indexBits={indexBits}
            offsetBits={offsetBits}
            note={
              last.outcome === "hit"
                ? `HIT in set ${last.index}, way ${last.way}`
                : last.outcome === "miss"
                  ? `MISS — filled set ${last.index}, way ${last.way}`
                  : `MISS + EVICT — set ${last.index}, way ${last.way} (dropped tag ${last.evictedTag})`
            }
            noteColor={COLORS[last.outcome]}
          />
        ) : (
          <p className="mono text-xs text-faint">
            Press Step or Run to replay the stream.
          </p>
        )}
      </div>

      {/* cache grid */}
      <div className="card p-4 overflow-x-auto">
        <div className="mono text-[10px] uppercase tracking-widest text-faint mb-3">
          cache · {numSets} sets × {ways} {ways === 1 ? "way" : "ways"} · LRU replacement
        </div>
        <div className="min-w-max space-y-2">
          {state.sets.map((row, s) => {
            const isTarget =
              nextDecoded?.index === s || (!nextDecoded && last?.index === s);
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="mono text-[11px] w-14 text-right pr-1"
                  style={{ color: isTarget ? "#39c5e0" : "#5b6b7d" }}
                >
                  set {s}
                </div>
                <div className="flex gap-2">
                  {row.map((line, w) => {
                    const isLast =
                      last !== null &&
                      !nextDecoded &&
                      last.index === s &&
                      last.way === w;
                    const accent = isLast ? COLORS[last.outcome] : null;
                    return (
                      <div
                        key={w}
                        className="rounded mono text-[11px] px-2.5 py-2 min-w-[88px]"
                        style={{
                          background: line.valid ? "#161c26" : "#10151d",
                          border: `1px solid ${accent ?? (line.valid ? "#1e2630" : "#1e2630")}`,
                          boxShadow: accent ? `0 0 0 1px ${accent}55` : "none",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-[9px] uppercase tracking-wider"
                            style={{ color: line.valid ? "#3fb950" : "#3a4654" }}
                          >
                            {line.valid ? "valid" : "empty"}
                          </span>
                          <span className="text-faint text-[9px]">w{w}</span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-2">
                          <span style={{ color: line.valid ? "#bc8cff" : "#3a4654" }}>
                            tag {line.valid ? line.tag : "—"}
                          </span>
                          <span className="text-faint text-[9px]">
                            {line.valid && ways > 1 ? `age ${line.lru}` : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-faint">
          A line stores the upper <span className="text-purple">tag</span> bits; the{" "}
          <span className="text-cyan">index</span> picks the set; the{" "}
          <span className="text-amber">offset</span> selects a byte inside the block.
          {ways > 1
            ? " On a full set, the line with the largest LRU age is evicted."
            : " Direct-mapped: each address has exactly one home line, so any conflict evicts."}
        </p>
      </div>
    </div>
  );
}

/* ----------------------------- sub-components ----------------------------- */

function ConfigRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mono text-[11px] uppercase tracking-widest text-faint w-24 shrink-0">
        {label}
      </span>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="mono text-xs rounded px-3 py-1 border transition-colors"
      style={{
        background: active ? "var(--color-green)" : "transparent",
        color: active ? "#06121a" : "var(--color-muted)",
        borderColor: active ? "var(--color-green)" : "var(--color-border)",
      }}
    >
      {children}
    </button>
  );
}

function BitTag({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="uppercase tracking-wider rounded-sm px-2 py-0.5"
      style={{ color, background: color + "14", border: `1px solid ${color}33` }}
    >
      {label}
    </span>
  );
}

function AddrSplit({
  addr,
  tag,
  index,
  offset,
  tagBits,
  indexBits,
  offsetBits,
  note,
  noteColor,
}: {
  addr: number;
  tag: number;
  index: number;
  offset: number;
  tagBits: number;
  indexBits: number;
  offsetBits: number;
  note: string;
  noteColor: string;
}) {
  const full = (addr & ((1 << ADDR_BITS) - 1)).toString(2).padStart(ADDR_BITS, "0");
  const tagStr = full.slice(0, tagBits);
  const indexStr = full.slice(tagBits, tagBits + indexBits);
  const offsetStr = full.slice(tagBits + indexBits);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="mono text-xs text-muted">
          addr {addr} = 0x{addr.toString(16).toUpperCase().padStart(2, "0")}
        </span>
        <div className="flex gap-1 mono text-sm">
          {tagStr.split("").map((b, i) => (
            <BitCell key={"t" + i} bit={b} color="#bc8cff" />
          ))}
          {indexStr.split("").map((b, i) => (
            <BitCell key={"i" + i} bit={b} color="#39c5e0" />
          ))}
          {offsetStr.split("").map((b, i) => (
            <BitCell key={"o" + i} bit={b} color="#e3a93c" />
          ))}
        </div>
      </div>
      <div className="flex gap-2 mono text-[11px]">
        <Field color="#bc8cff" label="tag" value={tag} />
        <Field color="#39c5e0" label="index" value={index} />
        <Field color="#e3a93c" label="offset" value={offset} />
      </div>
      <div className="mono text-xs" style={{ color: noteColor }}>
        → {note}
      </div>
    </div>
  );
}

function BitCell({ bit, color }: { bit: string; color: string }) {
  const on = bit === "1";
  return (
    <span
      className="grid place-items-center rounded font-bold"
      style={{
        width: 20,
        height: 28,
        background: on ? color : "#10151d",
        color: on ? "#06121a" : "#3a4654",
        border: `1px solid ${on ? color : "#1e2630"}`,
      }}
    >
      {bit}
    </span>
  );
}

function Field({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span
      className="rounded px-2 py-1"
      style={{ color, background: color + "14", border: `1px solid ${color}33` }}
    >
      <span className="text-faint uppercase tracking-wider text-[9px] mr-1">{label}</span>
      {value}
    </span>
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