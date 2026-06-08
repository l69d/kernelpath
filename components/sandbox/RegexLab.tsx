"use client";

import { useMemo, useState } from "react";

interface MatchInfo {
  match: string;
  index: number;
  groups: string[];
}

const SAMPLE =
  "Contact: alice@mit.edu, bob@stanford.edu. Call 555-123-4567 or 555.987.6543.\nIPv4 like 192.168.1.42 and 10.0.0.1 live here. Year 2026, kernel v6.9.";

const PRESETS: { name: string; pattern: string; flags: string }[] = [
  { name: "Email addresses", pattern: "[\\w.]+@[\\w.]+", flags: "g" },
  { name: "Phone numbers", pattern: "\\d{3}[-.]\\d{3}[-.]\\d{4}", flags: "g" },
  { name: "IPv4 addresses", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g" },
  { name: "Words (capture vowels)", pattern: "([aeiou])\\w+", flags: "gi" },
];

export default function RegexLab() {
  const [pattern, setPattern] = useState(PRESETS[0].pattern);
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState(SAMPLE);

  const { error, matches, regex } = useMemo(() => {
    if (!pattern) return { error: null, matches: [] as MatchInfo[], regex: null as RegExp | null };
    try {
      const safeFlags = flags.includes("g") ? flags : flags + "g";
      const re = new RegExp(pattern, safeFlags);
      const out: MatchInfo[] = [];
      let m: RegExpExecArray | null;
      let guard = 0;
      while ((m = re.exec(text)) !== null && guard < 5000) {
        out.push({ match: m[0], index: m.index, groups: m.slice(1) });
        if (m.index === re.lastIndex) re.lastIndex++; // avoid zero-width loop
        guard++;
      }
      return { error: null, matches: out, regex: re };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Invalid regex",
        matches: [] as MatchInfo[],
        regex: null,
      };
    }
  }, [pattern, flags, text]);

  // build highlighted segments
  const segments = useMemo(() => {
    if (error || matches.length === 0) return [{ text, hit: false }];
    const segs: { text: string; hit: boolean }[] = [];
    let last = 0;
    for (const m of matches) {
      if (m.index > last) segs.push({ text: text.slice(last, m.index), hit: false });
      segs.push({ text: m.match, hit: true });
      last = m.index + m.match.length;
    }
    if (last < text.length) segs.push({ text: text.slice(last), hit: false });
    return segs;
  }, [matches, text, error]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mono text-cyan text-lg">/</span>
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          spellCheck={false}
          className="flex-1 min-w-[200px] bg-surface border border-border rounded px-3 py-1.5 mono text-sm text-text outline-none focus:border-faint/50"
          placeholder="regular expression"
        />
        <span className="mono text-cyan text-lg">/</span>
        <input
          value={flags}
          onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ""))}
          className="w-20 bg-surface border border-border rounded px-3 py-1.5 mono text-sm text-text outline-none"
          placeholder="flags"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => {
              setPattern(p.pattern);
              setFlags(p.flags);
            }}
            className="mono text-[11px] rounded border border-border bg-surface px-2.5 py-1 text-muted hover:text-text"
          >
            {p.name}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="min-h-[120px] w-full rounded-lg border border-border bg-[#0a0e14] p-4 mono text-[13px] leading-relaxed text-text outline-none resize-y"
      />

      {error ? (
        <div className="card p-3 mono text-sm text-red border-l-2 border-red">
          ⚠ {error}
        </div>
      ) : (
        <>
          <div className="card p-4 mono text-[13px] leading-relaxed whitespace-pre-wrap break-words">
            {segments.map((s, i) =>
              s.hit ? (
                <mark
                  key={i}
                  style={{
                    background: "rgba(63,185,80,0.25)",
                    color: "var(--color-green-bright)",
                    borderRadius: 3,
                    padding: "0 2px",
                  }}
                >
                  {s.text}
                </mark>
              ) : (
                <span key={i} className="text-muted">
                  {s.text}
                </span>
              ),
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="mono rounded px-2 py-1 bg-green/10 text-green border border-green/30">
              {matches.length} match{matches.length === 1 ? "" : "es"}
            </span>
            {matches.length > 0 && matches[0].groups.length > 0 && (
              <span className="text-faint mono">
                groups per match: {matches[0].groups.length}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
