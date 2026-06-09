"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Section = "sha256" | "base64" | "caesar" | "xor";

const SECTIONS: { id: Section; label: string; color: string }[] = [
  { id: "sha256", label: "SHA-256", color: "#3fb950" },
  { id: "base64", label: "Base64", color: "#39c5e0" },
  { id: "caesar", label: "Caesar", color: "#bc8cff" },
  { id: "xor", label: "XOR", color: "#e3a93c" },
];

// ---- helpers ---------------------------------------------------------------

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

// Count differing bits between two equal-length hex strings (avalanche demo).
function hexBitDiff(a: string, b: string): { bits: number; total: number } {
  const n = Math.min(a.length, b.length);
  let diff = 0;
  for (let i = 0; i < n; i++) {
    const x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    diff += (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1) + ((x >> 3) & 1);
  }
  return { bits: diff, total: n * 4 };
}

// Base64 that survives non-Latin1 input by round-tripping through UTF-8 bytes.
function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function caesarShift(text: string, shift: number): string {
  const k = ((shift % 26) + 26) % 26;
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      out += String.fromCharCode(((code - 65 + k) % 26) + 65);
    } else if (code >= 97 && code <= 122) {
      out += String.fromCharCode(((code - 97 + k) % 26) + 97);
    } else {
      out += ch;
    }
  }
  return out;
}

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// XOR each plaintext byte against a repeating key (UTF-8 bytes both sides).
function xorBytes(textBytes: Uint8Array, keyBytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(textBytes.length);
  if (keyBytes.length === 0) {
    out.set(textBytes);
    return out;
  }
  for (let i = 0; i < textBytes.length; i++) {
    out[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return out;
}

// ---- component -------------------------------------------------------------

export default function HashCipher() {
  const [section, setSection] = useState<Section>("sha256");

  // SHA-256
  const [hashInput, setHashInput] = useState<string>("avalanche");
  const [digest, setDigest] = useState<string>("");
  const [prevDigest, setPrevDigest] = useState<string>("");
  const [hashError, setHashError] = useState<string>("");
  // Holds the most recently committed digest so each new computation can diff
  // against the prior one without running side effects inside a state updater.
  const digestRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;
    const subtle = typeof crypto !== "undefined" ? crypto.subtle : undefined;
    if (!subtle) {
      setHashError("Web Crypto API unavailable in this context.");
      setDigest("");
      return;
    }
    setHashError("");
    subtle
      .digest("SHA-256", new TextEncoder().encode(hashInput))
      .then((buf) => {
        if (cancelled) return;
        const hex = bytesToHex(new Uint8Array(buf));
        setPrevDigest(digestRef.current);
        digestRef.current = hex;
        setDigest(hex);
      })
      .catch(() => {
        if (!cancelled) setHashError("Failed to compute digest.");
      });
    return () => {
      cancelled = true;
    };
  }, [hashInput]);

  const avalanche = useMemo(() => {
    if (!digest || !prevDigest || digest === prevDigest) return null;
    return hexBitDiff(digest, prevDigest);
  }, [digest, prevDigest]);

  // Base64
  const [b64Plain, setB64Plain] = useState<string>("Hello, kernel 🐧");
  const [b64Cipher, setB64Cipher] = useState<string>("");

  // keep an encoded value derived from plaintext
  const b64Encoded = useMemo(() => {
    try {
      return utf8ToBase64(b64Plain);
    } catch {
      return "";
    }
  }, [b64Plain]);

  // Caesar
  const [caesarText, setCaesarText] = useState<string>("Attack at dawn");
  const [shift, setShift] = useState<number>(3);
  const caesarOut = useMemo(
    () => caesarShift(caesarText, shift),
    [caesarText, shift],
  );

  // XOR
  const [xorText, setXorText] = useState<string>("secret message");
  const [xorKey, setXorKey] = useState<string>("k3y");
  const xorResult = useMemo(() => {
    const tb = new TextEncoder().encode(xorText);
    const kb = new TextEncoder().encode(xorKey);
    const enc = xorBytes(tb, kb);
    const dec = xorBytes(enc, kb);
    let recovered = "";
    try {
      recovered = new TextDecoder().decode(dec);
    } catch {
      recovered = "";
    }
    return {
      hex: bytesToHex(enc),
      recovered,
      ok: recovered === xorText,
      keyEmpty: kb.length === 0,
    };
  }, [xorText, xorKey]);

  return (
    <div className="space-y-5">
      {/* section tabs */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => {
          const active = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className="mono text-xs rounded px-3 py-1.5 border transition-colors"
              style={{
                background: active ? s.color : "transparent",
                color: active ? "#06121a" : "var(--color-muted)",
                borderColor: active ? s.color : "var(--color-border)",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {section === "sha256" && (
        <div className="space-y-4">
          <label className="mono text-xs text-muted flex items-center gap-2">
            message =
            <input
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              className="flex-1 min-w-0 bg-surface border border-border rounded px-3 py-1.5 mono text-sm text-text outline-none focus:border-faint/50"
              placeholder="type anything…"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {["", "avalanche", "avalanchf", "The quick brown fox"].map((p) => (
              <button
                key={p || "(empty)"}
                onClick={() => setHashInput(p)}
                className="mono text-[11px] rounded px-2 py-1 border border-border bg-surface text-muted hover:text-text"
              >
                {p === "" ? "(empty)" : p}
              </button>
            ))}
          </div>

          <div className="card p-4">
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2">
              SHA-256 digest · 256 bits · 64 hex chars
            </div>
            {hashError ? (
              <p className="mono text-xs" style={{ color: "#f85149" }}>
                {hashError}
              </p>
            ) : (
              <div className="mono text-sm break-all leading-relaxed text-green">
                {digest.match(/.{1,8}/g)?.map((chunk, i) => (
                  <span key={i} className="mr-2 inline-block">
                    {chunk}
                  </span>
                )) ?? "…"}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Cell label="input bytes" value={String(new TextEncoder().encode(hashInput).length)} color="#39c5e0" />
            <Cell label="output bits" value="256" color="#bc8cff" />
            <Cell
              label="vs. previous"
              value={avalanche ? `${avalanche.bits}/${avalanche.total} bits` : "—"}
              color="#e3a93c"
            />
          </div>

          <p className="text-xs text-faint leading-relaxed">
            <span className="text-amber">Avalanche effect:</span> change one
            character and roughly half of the 256 output bits flip. Try the{" "}
            <span className="text-text">avalanche</span> →{" "}
            <span className="text-text">avalanchf</span> presets above and watch
            the &ldquo;vs. previous&rdquo; bit count. SHA-256 is a one-way hash:
            you cannot recover the message from the digest.
          </p>
        </div>
      )}

      {section === "base64" && (
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <div className="mono text-[10px] uppercase tracking-widest text-faint">
              encode · text → base64
            </div>
            <textarea
              value={b64Plain}
              onChange={(e) => setB64Plain(e.target.value)}
              rows={2}
              className="w-full resize-none bg-surface border border-border rounded px-3 py-2 mono text-sm text-text outline-none focus:border-faint/50"
              placeholder="plaintext (UTF-8 safe)…"
            />
            <div className="rounded-md border border-border bg-bg px-3 py-2 mono text-sm break-all text-cyan min-h-[2.25rem]">
              {b64Encoded || <span className="text-faint">(empty)</span>}
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <div className="mono text-[10px] uppercase tracking-widest text-faint">
              decode · base64 → text
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setB64Cipher(b64Encoded)}
                className="mono text-[11px] rounded px-2 py-1 border border-border bg-surface text-muted hover:text-text"
              >
                ← copy encoded
              </button>
            </div>
            <textarea
              value={b64Cipher}
              onChange={(e) => setB64Cipher(e.target.value)}
              rows={2}
              className="w-full resize-none bg-surface border border-border rounded px-3 py-2 mono text-sm text-text outline-none focus:border-faint/50"
              placeholder="paste base64…"
            />
            <div className="rounded-md border border-border bg-bg px-3 py-2 mono text-sm break-all min-h-[2.25rem]">
              {(() => {
                if (b64Cipher.trim() === "")
                  return <span className="text-faint">(empty)</span>;
                try {
                  const decoded = base64ToUtf8(b64Cipher);
                  return <span className="text-green">{decoded}</span>;
                } catch {
                  return (
                    <span style={{ color: "#f85149" }}>
                      not valid base64
                    </span>
                  );
                }
              })()}
            </div>
          </div>

          <p className="text-xs text-faint leading-relaxed">
            Base64 maps every 3 bytes onto 4 ASCII characters from{" "}
            <span className="text-text">A–Z a–z 0–9 + /</span>, padding with{" "}
            <span className="text-text">=</span>. It is{" "}
            <span className="text-amber">encoding, not encryption</span> — anyone
            can decode it. The UTF-8 round-trip here keeps emoji and non-Latin1
            text intact, which raw <span className="text-text">btoa</span> would
            choke on.
          </p>
        </div>
      )}

      {section === "caesar" && (
        <div className="space-y-4">
          <label className="mono text-xs text-muted flex items-center gap-2">
            text =
            <input
              value={caesarText}
              onChange={(e) => setCaesarText(e.target.value)}
              className="flex-1 min-w-0 bg-surface border border-border rounded px-3 py-1.5 mono text-sm text-text outline-none focus:border-faint/50"
              placeholder="message to shift…"
            />
          </label>

          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="mono text-[10px] uppercase tracking-widest text-faint">
                shift
              </span>
              <input
                type="range"
                min={0}
                max={25}
                value={shift}
                onChange={(e) => setShift(Number(e.target.value))}
                className="flex-1 accent-[#bc8cff]"
              />
              <span
                className="mono text-sm font-bold w-10 text-right"
                style={{ color: "#bc8cff" }}
              >
                {shift}
              </span>
            </div>

            {/* shifted alphabet map */}
            <div className="overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {ALPHA.split("").map((ch, i) => {
                  const mapped = caesarShift(ch, shift);
                  return (
                    <div key={ch} className="text-center">
                      <div className="mono text-[10px] text-faint">{ch}</div>
                      <div
                        className="grid place-items-center rounded mono text-xs font-bold"
                        style={{
                          width: 22,
                          height: 26,
                          background: "#161c26",
                          border: "1px solid #1e2630",
                          color: i % 2 === 0 ? "#bc8cff" : "#d6dee8",
                        }}
                      >
                        {mapped}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="card p-3">
              <div className="mono text-[10px] uppercase tracking-widest text-faint">
                encoded (+{shift})
              </div>
              <div className="mono text-sm mt-1 break-all text-purple min-h-[1.5rem]">
                {caesarOut || <span className="text-faint">(empty)</span>}
              </div>
            </div>
            <div className="card p-3">
              <div className="mono text-[10px] uppercase tracking-widest text-faint">
                decoded (−{shift})
              </div>
              <div className="mono text-sm mt-1 break-all text-green min-h-[1.5rem]">
                {caesarShift(caesarOut, -shift) || (
                  <span className="text-faint">(empty)</span>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-faint leading-relaxed">
            Each letter rotates forward by the shift, wrapping{" "}
            <span className="text-text">Z → A</span>; non-letters pass through
            unchanged. With only 26 keys it is trivially broken by brute force.
            A shift of <span className="text-text">13</span> is the self-inverse{" "}
            <span className="text-amber">ROT13</span>.
          </p>
        </div>
      )}

      {section === "xor" && (
        <div className="space-y-4">
          <label className="mono text-xs text-muted flex items-center gap-2">
            text =
            <input
              value={xorText}
              onChange={(e) => setXorText(e.target.value)}
              className="flex-1 min-w-0 bg-surface border border-border rounded px-3 py-1.5 mono text-sm text-text outline-none focus:border-faint/50"
              placeholder="plaintext…"
            />
          </label>
          <label className="mono text-xs text-muted flex items-center gap-2">
            key&nbsp;&nbsp;=
            <input
              value={xorKey}
              onChange={(e) => setXorKey(e.target.value)}
              className="flex-1 min-w-0 bg-surface border border-border rounded px-3 py-1.5 mono text-sm text-text outline-none focus:border-faint/50"
              placeholder="repeating key…"
            />
          </label>

          {xorResult.keyEmpty && (
            <p className="mono text-xs" style={{ color: "#e3a93c" }}>
              empty key — XOR with 0 is a no-op (ciphertext equals plaintext).
            </p>
          )}

          <div className="card p-4 space-y-2">
            <div className="mono text-[10px] uppercase tracking-widest text-faint">
              ciphertext · hex bytes
            </div>
            <div className="mono text-sm break-all text-amber min-h-[1.5rem]">
              {xorResult.hex
                ? xorResult.hex.match(/.{1,2}/g)?.map((b, i) => (
                    <span key={i} className="mr-1.5 inline-block">
                      {b}
                    </span>
                  ))
                : <span className="text-faint">(empty)</span>}
            </div>
          </div>

          <div className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="mono text-[10px] uppercase tracking-widest text-faint">
                XOR again with same key → recovered
              </div>
              <span
                className="mono text-[10px] rounded px-2 py-0.5 border"
                style={
                  xorResult.ok
                    ? {
                        color: "#3fb950",
                        borderColor: "#3fb95055",
                        background: "#3fb95014",
                      }
                    : {
                        color: "#f85149",
                        borderColor: "#f8514955",
                        background: "#f8514914",
                      }
                }
              >
                {xorResult.ok ? "round-trip ✓" : "mismatch"}
              </span>
            </div>
            <div className="mono text-sm break-all text-green min-h-[1.5rem]">
              {xorResult.recovered || (
                <span className="text-faint">(empty)</span>
              )}
            </div>
          </div>

          <p className="text-xs text-faint leading-relaxed">
            XOR is its own inverse:{" "}
            <span className="text-text">(p ⊕ k) ⊕ k = p</span>, so the same key
            both encrypts and decrypts. With a truly random key as long as the
            message this is the unbreakable{" "}
            <span className="text-amber">one-time pad</span> — but reusing a short
            key (as above) leaks structure and is easily cracked.
          </p>
        </div>
      )}
    </div>
  );
}

function Cell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card p-3 text-center">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">
        {label}
      </div>
      <div
        className="mono text-base font-bold mt-1 truncate"
        style={{ color }}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}
