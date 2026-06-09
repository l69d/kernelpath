"use client";

import { useEffect, useMemo, useState } from "react";

/* ---------------- cs10-05 Raft leader election ---------------- */

type Role = "follower" | "candidate" | "leader" | "down";

interface Node {
  id: number;
  role: Role;
  term: number;
  votedFor: number | null;
}

interface Snapshot {
  nodes: Node[];
  term: number;
  caption: string;
  leader: number | null;
}

const N = 5;
const MAJORITY = Math.floor(N / 2) + 1; // 3 of 5

const ROLE_COLOR: Record<Role, string> = {
  follower: "#58a6ff",
  candidate: "#e3a93c",
  leader: "#3fb950",
  down: "#f85149",
};

const ROLE_LABEL: Record<Role, string> = {
  follower: "FOLLOWER",
  candidate: "CANDIDATE",
  leader: "LEADER",
  down: "CRASHED",
};

function base(term: number, leader: number): Node[] {
  return Array.from({ length: N }, (_, id) => ({
    id,
    role: id === leader ? "leader" : "follower",
    term,
    votedFor: leader,
  }));
}

/** Build the full deterministic timeline of an election + a crash + re-election. */
function buildTimeline(): Snapshot[] {
  const frames: Snapshot[] = [];
  // candidate 2 wins term 1, then crashes; candidate 0 wins term 2.
  const cand1 = 2;
  const cand2 = 0;

  // 0: steady state, leader = node 2, term 1
  frames.push({
    nodes: base(1, cand1),
    term: 1,
    leader: cand1,
    caption: "Steady state. Node 2 is the leader for term 1 and sends periodic heartbeats so followers stay calm.",
  });

  // CRASH the leader -> election timeout fires on a follower
  let nodes = base(1, cand1).map((n) =>
    n.id === cand1 ? { ...n, role: "down" as Role, votedFor: null } : n,
  );
  frames.push({
    nodes: nodes.map((n) => ({ ...n })),
    term: 1,
    leader: null,
    caption: "The leader crashes. Heartbeats stop arriving — followers no longer hear from anyone.",
  });

  // a follower times out, becomes candidate, bumps term, votes for itself
  nodes = nodes.map((n) => {
    if (n.role === "down") return { ...n };
    if (n.id === cand2) return { ...n, role: "candidate" as Role, term: 2, votedFor: cand2 };
    return { ...n, term: n.term };
  });
  frames.push({
    nodes: nodes.map((n) => ({ ...n })),
    term: 2,
    leader: null,
    caption: "Node 0's election timeout fires first. It increments the term to 2, becomes a CANDIDATE, and votes for itself (1 vote).",
  });

  // requests votes; followers grant
  const voters = [0, 1, 3, 4].filter((v) => v !== cand2); // 1,3,4
  let granted = 1; // self
  for (const v of voters) {
    granted += 1;
    nodes = nodes.map((n) =>
      n.id === v ? { ...n, term: 2, votedFor: cand2 } : { ...n },
    );
    const reached = granted >= MAJORITY;
    frames.push({
      nodes: nodes.map((n) => ({ ...n })),
      term: 2,
      leader: null,
      caption: reached
        ? `Node ${v} grants its vote — that's ${granted} of ${N}, a majority (≥ ${MAJORITY}). Node 0 has won the election.`
        : `Node 0 sends RequestVote RPCs. Node ${v} grants its vote (${granted} of ${N}). Still short of a majority (${MAJORITY}).`,
    });
    if (reached) break;
  }

  // becomes leader, sends heartbeats
  nodes = nodes.map((n) =>
    n.id === cand2 ? { ...n, role: "leader" as Role } : { ...n },
  );
  frames.push({
    nodes: nodes.map((n) => ({ ...n })),
    term: 2,
    leader: cand2,
    caption: "Node 0 becomes LEADER for term 2 and immediately sends heartbeats. The crashed node, when it rejoins, will step down to a follower at the higher term.",
  });

  return frames;
}

function nodePos(id: number, cx: number, cy: number, r: number): { x: number; y: number } {
  const angle = (-Math.PI / 2) + (id * 2 * Math.PI) / N;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export default function RaftViz() {
  const timeline = useMemo(buildTimeline, []);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= timeline.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1400);
    return () => clearInterval(t);
  }, [playing, timeline.length]);

  const snap = timeline[step];
  const cx = 150;
  const cy = 130;
  const ring = 92;

  const accent = snap.leader !== null ? "#3fb950" : "#e3a93c";

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        <div className="flex flex-col md:flex-row items-center gap-5 py-2">
          {/* cluster diagram */}
          <svg
            viewBox="0 0 300 260"
            className="w-full"
            style={{ maxHeight: 260, minWidth: 240 }}
          >
            {/* term badge in the center */}
            <circle cx={cx} cy={cy} r={34} fill="#10151d" stroke="#1e2630" strokeWidth={1} />
            <text x={cx} y={cy - 6} textAnchor="middle" className="mono" fontSize={9} fill="#5b6b7d">
              TERM
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" className="mono" fontSize={20} fontWeight={700} fill={accent}>
              {snap.term}
            </text>

            {/* heartbeat / vote links from leader-or-candidate */}
            {snap.nodes.map((n) => {
              const src = snap.nodes.find(
                (m) => m.role === "leader" || m.role === "candidate",
              );
              if (!src || src.id === n.id || n.role === "down") return null;
              const a = nodePos(src.id, cx, cy, ring);
              const b = nodePos(n.id, cx, cy, ring);
              const isLeader = src.role === "leader";
              const granted = n.votedFor === src.id;
              const show = isLeader || granted;
              return (
                <line
                  key={`l-${n.id}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={show ? (isLeader ? "#3fb950" : "#e3a93c") : "#1e2630"}
                  strokeWidth={show ? 1.5 : 1}
                  strokeDasharray={isLeader ? "0" : "4 3"}
                  opacity={show ? 0.85 : 0.4}
                />
              );
            })}

            {/* nodes */}
            {snap.nodes.map((n) => {
              const p = nodePos(n.id, cx, cy, ring);
              const c = ROLE_COLOR[n.role];
              const big = n.role === "leader" || n.role === "candidate";
              return (
                <g key={n.id}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={big ? 22 : 18}
                    fill={`${c}1f`}
                    stroke={c}
                    strokeWidth={big ? 2.5 : 1.5}
                    strokeDasharray={n.role === "down" ? "3 3" : "0"}
                  />
                  <text x={p.x} y={p.y - 1} textAnchor="middle" className="mono" fontSize={11} fontWeight={700} fill={c}>
                    {n.id}
                  </text>
                  <text x={p.x} y={p.y + 10} textAnchor="middle" className="mono" fontSize={6.5} fill="#8a97a8">
                    t{n.term}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* side panel */}
          <div className="flex-1 w-full space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(["leader", "candidate", "follower", "down"] as Role[]).map((r) => {
                const count = snap.nodes.filter((n) => n.role === r).length;
                return (
                  <div
                    key={r}
                    className="card py-2 px-2.5 flex items-center justify-between"
                    style={{ borderColor: count ? `${ROLE_COLOR[r]}55` : "#1e2630" }}
                  >
                    <span className="mono text-[10px]" style={{ color: ROLE_COLOR[r] }}>
                      {ROLE_LABEL[r]}
                    </span>
                    <span className="mono text-sm font-bold" style={{ color: count ? ROLE_COLOR[r] : "#5b6b7d" }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="card p-3 min-h-[88px]">
              <div className="mono text-[10px] uppercase tracking-widest text-faint mb-1">
                step {step + 1} / {timeline.length}
              </div>
              <p className="text-sm text-muted">{snap.caption}</p>
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.max(0, s - 1));
          }}
          className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
        >
          prev
        </button>
        <button
          onClick={() => {
            if (step >= timeline.length - 1) {
              setStep(0);
              setPlaying(true);
            } else {
              setPlaying((p) => !p);
            }
          }}
          className="mono text-[11px] rounded px-3 py-1"
          style={{ background: accent, color: "#06121a", fontWeight: 700 }}
        >
          {step >= timeline.length - 1 ? "↻ replay" : playing ? "❚❚ pause" : "▶ play"}
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.min(timeline.length - 1, s + 1));
          }}
          className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
        >
          next
        </button>
        <div className="flex gap-1 ml-2">
          {timeline.map((_, i) => (
            <button
              key={i}
              aria-label={`step ${i + 1}`}
              onClick={() => {
                setPlaying(false);
                setStep(i);
              }}
              className="h-1.5 w-4 rounded-full transition-all"
              style={{ background: i === step ? accent : i < step ? "#2b3a49" : "#1e2630" }}
            />
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Raft needs a majority ({MAJORITY} of {N}) to elect a leader. A crash triggers a new election with a higher term — so a stale leader can never win twice.
      </p>
    </div>
  );
}
