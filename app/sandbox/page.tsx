"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import BitLab from "@/components/sandbox/BitLab";
import JsPlayground from "@/components/sandbox/JsPlayground";
import RegexLab from "@/components/sandbox/RegexLab";
import SortingViz from "@/components/sandbox/SortingViz";
import AlgorithmViz from "@/components/sandbox/AlgorithmViz";
import LogicGates from "@/components/sandbox/LogicGates";
import CpuSim from "@/components/sandbox/CpuSim";
import Ieee754Lab from "@/components/sandbox/Ieee754Lab";
import CacheSim from "@/components/sandbox/CacheSim";
import Scheduler from "@/components/sandbox/Scheduler";
import Paging from "@/components/sandbox/Paging";
import DfaSim from "@/components/sandbox/DfaSim";
import TuringMachine from "@/components/sandbox/TuringMachine";
import GradientDescent from "@/components/sandbox/GradientDescent";
import KMeans from "@/components/sandbox/KMeans";
import HashCipher from "@/components/sandbox/HashCipher";
import SqlPlayground from "@/components/sandbox/SqlPlayground";

type Cat =
  | "Algorithms"
  | "Hardware & Low-Level"
  | "Operating System"
  | "Theory & Languages"
  | "AI & Data"
  | "Security & Data";

interface Tool {
  id: string;
  name: string;
  glyph: string;
  blurb: string;
  relates: string;
  cat: Cat;
  Comp: ComponentType;
}

const TOOLS: Tool[] = [
  {
    id: "algorithms",
    name: "Algorithm Visualizer",
    glyph: "λ",
    blurb:
      "Watch 30 classic algorithms run line by line — the executing source and a plain-English explanation sit right beside the live data.",
    relates: "Code + Visualization · 8 categories",
    cat: "Algorithms",
    Comp: AlgorithmViz,
  },
  {
    id: "sort",
    name: "Sorting Race",
    glyph: "↕",
    blurb:
      "Watch five sorting algorithms work as animated bars, and feel the difference between O(n²) and O(n log n).",
    relates: "Algorithms · Data Structures",
    cat: "Algorithms",
    Comp: SortingViz,
  },
  {
    id: "bits",
    name: "Bit Lab",
    glyph: "01",
    blurb:
      "Flip bits and watch binary, hex and two's-complement update live, then run bitwise operators.",
    relates: "Foundations · C · Architecture",
    cat: "Hardware & Low-Level",
    Comp: BitLab,
  },
  {
    id: "gates",
    name: "Logic Gates",
    glyph: "&",
    blurb:
      "Toggle inputs and watch every basic gate respond — then build a half-adder and full-adder from them.",
    relates: "Digital Logic · From NAND up",
    cat: "Hardware & Low-Level",
    Comp: LogicGates,
  },
  {
    id: "cpu",
    name: "CPU Simulator",
    glyph: "▦",
    blurb:
      "Write toy assembly and single-step the fetch-decode-execute cycle, watching registers, memory, flags and the PC.",
    relates: "Computer Architecture · Assembly",
    cat: "Hardware & Low-Level",
    Comp: CpuSim,
  },
  {
    id: "float",
    name: "IEEE-754 Floats",
    glyph: "0.1",
    blurb:
      "Decompose a float into sign, exponent and mantissa bits — and see why 0.1 can't be stored exactly.",
    relates: "Number Representation · Architecture",
    cat: "Hardware & Low-Level",
    Comp: Ieee754Lab,
  },
  {
    id: "cache",
    name: "Cache Simulator",
    glyph: "▤",
    blurb:
      "Replay an address stream against a configurable cache and watch hits, misses and evictions in real time.",
    relates: "Memory Hierarchy · Architecture",
    cat: "Hardware & Low-Level",
    Comp: CacheSim,
  },
  {
    id: "sched",
    name: "CPU Scheduler",
    glyph: "⏱",
    blurb:
      "Compare FCFS, SJF, Round-Robin and Priority scheduling on the same processes via an animated Gantt chart.",
    relates: "Operating Systems · Scheduling",
    cat: "Operating System",
    Comp: Scheduler,
  },
  {
    id: "paging",
    name: "Page Replacement",
    glyph: "⊞",
    blurb:
      "Feed a reference string through FIFO, LRU, Optimal and Clock and watch page faults accumulate frame by frame.",
    relates: "Operating Systems · Virtual Memory",
    cat: "Operating System",
    Comp: Paging,
  },
  {
    id: "regex",
    name: "Regex Lab",
    glyph: ".*",
    blurb:
      "Build a regular expression and watch it match in real time. Finite automata, made tangible.",
    relates: "Theory of Computation · Compilers",
    cat: "Theory & Languages",
    Comp: RegexLab,
  },
  {
    id: "code",
    name: "JS Playground",
    glyph: "{}",
    blurb:
      "Write and run JavaScript in a sandboxed worker. Test recursion, closures, sorting — anything.",
    relates: "Programming · Algorithms",
    cat: "Theory & Languages",
    Comp: JsPlayground,
  },
  {
    id: "dfa",
    name: "DFA Simulator",
    glyph: "◯",
    blurb:
      "Run an input string through a finite automaton and watch the active state hop across the diagram, accept or reject.",
    relates: "Theory of Computation · Automata",
    cat: "Theory & Languages",
    Comp: DfaSim,
  },
  {
    id: "turing",
    name: "Turing Machine",
    glyph: "⊢",
    blurb:
      "Watch a Turing machine crawl its tape — read, write, move — the simplest model of all computation.",
    relates: "Theory of Computation · Computability",
    cat: "Theory & Languages",
    Comp: TuringMachine,
  },
  {
    id: "gd",
    name: "Gradient Descent",
    glyph: "∇",
    blurb:
      "Roll a ball down a loss curve and feel how the learning rate decides between converging, crawling and diverging.",
    relates: "Machine Learning · Optimization",
    cat: "AI & Data",
    Comp: GradientDescent,
  },
  {
    id: "kmeans",
    name: "K-Means Clustering",
    glyph: "◇",
    blurb:
      "Step through assign-and-update until the clusters snap into place around their centroids.",
    relates: "Machine Learning · Unsupervised",
    cat: "AI & Data",
    Comp: KMeans,
  },
  {
    id: "crypto",
    name: "Hash & Cipher",
    glyph: "#",
    blurb:
      "Hash with real SHA-256, encode Base64, and watch classic Caesar and XOR ciphers transform text live.",
    relates: "Security · Cryptography",
    cat: "Security & Data",
    Comp: HashCipher,
  },
  {
    id: "sql",
    name: "SQL Playground",
    glyph: "⊟",
    blurb:
      "Run real SQL against an in-browser SQLite database — joins, aggregates, subqueries — no backend.",
    relates: "Databases · SQL",
    cat: "Security & Data",
    Comp: SqlPlayground,
  },
];

const CATS: Cat[] = [
  "Algorithms",
  "Hardware & Low-Level",
  "Operating System",
  "Theory & Languages",
  "AI & Data",
  "Security & Data",
];

const CAT_COLOR: Record<Cat, string> = {
  Algorithms: "#3fb950",
  "Hardware & Low-Level": "#39c5e0",
  "Operating System": "#e3a93c",
  "Theory & Languages": "#bc8cff",
  "AI & Data": "#f778ba",
  "Security & Data": "#58a6ff",
};

export default function SandboxPage() {
  const [activeId, setActiveId] = useState<string>("algorithms");
  const tool = TOOLS.find((t) => t.id === activeId) ?? TOOLS[0];
  const Comp = tool.Comp;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-2 text-xs mono text-faint mb-4">
        <Link href="/" className="hover:text-text">
          roadmap
        </Link>
        <span>/</span>
        <span className="text-muted">sandbox</span>
      </div>

      <h1 className="text-3xl md:text-4xl font-black tracking-tight">
        The <span className="text-green">Sandbox</span>
      </h1>
      <p className="mt-2 text-muted max-w-2xl">
        Reading is not understanding. Tinker here — single-step an algorithm,
        run toy assembly on a CPU, flip bits, fault a page, train a tiny model —
        until the concepts feel obvious. Everything runs entirely in your
        browser, no backend.
      </p>

      {/* category nav */}
      <div className="mt-8 flex flex-wrap gap-2">
        {CATS.map((c) => {
          const tools = TOOLS.filter((t) => t.cat === c);
          const activeInCat = tools.some((t) => t.id === activeId);
          return (
            <button
              key={c}
              onClick={() => setActiveId(tools[0].id)}
              className="rounded-lg border px-3 py-1.5 text-sm transition-colors"
              style={{
                background: activeInCat ? CAT_COLOR[c] + "1f" : "transparent",
                borderColor: activeInCat ? CAT_COLOR[c] : "var(--color-border)",
                color: activeInCat ? "var(--color-text)" : "var(--color-muted)",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* tool chips within the active category */}
      <div className="mt-3 flex flex-wrap gap-2">
        {TOOLS.filter((t) => t.cat === tool.cat).map((t) => {
          const on = t.id === activeId;
          const color = CAT_COLOR[t.cat];
          return (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
              style={{
                background: on ? "var(--color-surface-2)" : "transparent",
                borderColor: on ? color : "var(--color-border)",
                color: on ? "var(--color-text)" : "var(--color-muted)",
              }}
            >
              <span
                className="grid h-6 w-6 place-items-center rounded mono text-[10px] font-bold"
                style={{
                  background: on ? color : "var(--color-surface)",
                  color: on ? "#06121a" : "var(--color-faint)",
                }}
              >
                {t.glyph}
              </span>
              {t.name}
            </button>
          );
        })}
      </div>

      {/* active tool header */}
      <div className="mt-6 mb-5">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold">{tool.name}</h2>
          <span className="mono text-[11px] text-faint">{tool.relates}</span>
        </div>
        <p className="text-sm text-muted mt-1">{tool.blurb}</p>
      </div>

      <div className="card p-5">
        <Comp />
      </div>

      <p className="mt-6 text-xs text-faint text-center">
        {TOOLS.length} interactive tools, all client-side. Found a bug or want
        another tool? The whole sandbox is open source.
      </p>
    </div>
  );
}
