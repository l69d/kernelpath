"use client";

import { useMemo, useState } from "react";

/* ================================================================== *
 *  cs14-03 — Public-Key Cryptography
 *  Lock-and-key metaphor + a tiny live RSA modexp demo (n=33, e=3, d=7).
 *  ENCRYPT: public key locks, only private key unlocks (public fails).
 *  SIGN:    private key signs, public key verifies (roles reversed).
 * ================================================================== */

const N = 33; // modulus  (p=3, q=11)
const E = 3; // public exponent
const D = 7; // private exponent  (e·d ≡ 1 mod φ, 3·7 = 21 ≡ 1 mod 20)

function modpow(base: number, exp: number, mod: number): number {
  let result = 1;
  let b = base % mod;
  let e = exp;
  while (e > 0) {
    if (e & 1) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1;
  }
  return result;
}

type Mode = "encrypt" | "sign";

interface KeyToken {
  label: string;
  value: string;
  color: string;
  kind: "public" | "private";
}

function KeyChip({ k, dim }: { k: KeyToken; dim: boolean }) {
  return (
    <span
      className="mono text-[10px] rounded px-2 py-1 inline-flex items-center gap-1 transition-all"
      style={{
        background: dim ? "#10151d" : `${k.color}1f`,
        color: dim ? "#5b6b7d" : k.color,
        border: `1px solid ${dim ? "#1e2630" : `${k.color}66`}`,
      }}
    >
      <span>{k.kind === "public" ? "🔓" : "🔑"}</span>
      {k.label} {k.value}
    </span>
  );
}

function Cell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card py-2 px-2 text-center">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-base font-bold mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}

export default function PublicKeyViz() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [msg, setMsg] = useState(7);
  const [useWrongKey, setUseWrongKey] = useState(false);

  // In ENCRYPT, public key (e) locks → private key (d) should unlock.
  // In SIGN,    private key (d) signs → public key (e) verifies.
  const transformExp = mode === "encrypt" ? E : D;
  const transformColor = mode === "encrypt" ? "#39c5e0" : "#bc8cff"; // public=cyan, private=purple
  const transformedLabel = mode === "encrypt" ? "ciphertext" : "signature";

  const transformed = useMemo(() => modpow(msg, transformExp, N), [msg, transformExp]);

  // Reverse step: correct key restores the message; the OTHER key does not.
  const correctReverseExp = mode === "encrypt" ? D : E;
  const wrongReverseExp = mode === "encrypt" ? E : D;
  const usedReverseExp = useWrongKey ? wrongReverseExp : correctReverseExp;
  const recovered = useMemo(() => modpow(transformed, usedReverseExp, N), [transformed, usedReverseExp]);
  const success = recovered === msg && !useWrongKey;

  const reverseColor = useWrongKey
    ? "#f85149"
    : mode === "encrypt"
      ? "#bc8cff" // private unlocks
      : "#39c5e0"; // public verifies

  const lockKey: KeyToken =
    mode === "encrypt"
      ? { label: "pub e", value: String(E), color: "#39c5e0", kind: "public" }
      : { label: "priv d", value: String(D), color: "#bc8cff", kind: "private" };

  const correctUnlockKey: KeyToken =
    mode === "encrypt"
      ? { label: "priv d", value: String(D), color: "#bc8cff", kind: "private" }
      : { label: "pub e", value: String(E), color: "#39c5e0", kind: "public" };
  const wrongUnlockKey: KeyToken =
    mode === "encrypt"
      ? { label: "pub e", value: String(E), color: "#39c5e0", kind: "public" }
      : { label: "priv d", value: String(D), color: "#bc8cff", kind: "private" };
  const activeUnlockKey = useWrongKey ? wrongUnlockKey : correctUnlockKey;

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* mode toggle */}
        <div className="flex items-center justify-center gap-2 py-1">
          {(["encrypt", "sign"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setUseWrongKey(false); }}
              className="mono text-[11px] font-bold rounded-lg px-4 py-2 transition-all"
              style={{
                background: mode === m ? (m === "encrypt" ? "#39c5e0" : "#bc8cff") : "#10151d",
                border: `1px solid ${mode === m ? (m === "encrypt" ? "#39c5e0" : "#bc8cff") : "#1e2630"}`,
                color: mode === m ? "#06121a" : "#8a97a8",
              }}
            >
              {m === "encrypt" ? "🔒 ENCRYPT" : "✍ SIGN"}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-muted mt-2 mb-3">
          {mode === "encrypt"
            ? "Anyone with the public key can lock a message — but only the private key opens it."
            : "Only the private key can sign — and anyone can use the public key to verify it's genuine."}
        </p>

        {/* message slider */}
        <div className="px-1 mb-3">
          <input
            type="range"
            min={2}
            max={32}
            value={msg}
            onChange={(e) => setMsg(Number(e.target.value))}
            className="w-full accent-[#3fb950]"
            aria-label="message value"
          />
          <div className="mono text-[10px] text-faint text-center mt-1">
            drag to choose message m = {msg}
          </div>
        </div>

        {/* pipeline: m  --lock-->  transformed  --unlock-->  recovered */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
          <Cell label="message m" value={String(msg)} color="#3fb950" />

          <div className="text-center">
            <div className="flex justify-center mb-1">
              <KeyChip k={lockKey} dim={false} />
            </div>
            <div className="text-xl leading-none" style={{ color: transformColor }}>→</div>
            <div className="mono text-[9px] text-faint mt-1">mᵉ mod {N}</div>
          </div>

          <Cell label={transformedLabel} value={String(transformed)} color={transformColor} />

          <div className="text-center">
            <div className="flex justify-center mb-1">
              <KeyChip k={activeUnlockKey} dim={false} />
            </div>
            <div className="text-xl leading-none" style={{ color: reverseColor }}>→</div>
            <div className="mono text-[9px] text-faint mt-1">cˣ mod {N}</div>
          </div>

          <Cell
            label={mode === "encrypt" ? "decrypted" : "verify → m?"}
            value={String(recovered)}
            color={success ? "#56d364" : "#f85149"}
          />
        </div>

        {/* verdict + wrong-key probe */}
        <div
          className="card p-4 mt-4 flex items-start gap-3 transition-all"
          style={{
            border: `1px solid ${success ? "#3fb95066" : "#f8514966"}`,
            background: success ? "#3fb9501a" : "#f851491a",
          }}
        >
          <span className="text-lg leading-none mt-0.5">{success ? "✅" : "🚫"}</span>
          <div>
            <div className="mono text-xs font-bold" style={{ color: success ? "#56d364" : "#f85149" }}>
              {success
                ? mode === "encrypt"
                  ? `Private key recovered m = ${recovered}. The secret survived.`
                  : `Public key verified: got ${recovered} = m. Signature is authentic.`
                : useWrongKey
                  ? `Wrong key → ${recovered} ≠ ${msg}. Garbage out.`
                  : `Mismatch.`}
            </div>
            <p className="text-sm text-muted mt-1">
              {success
                ? mode === "encrypt"
                  ? "The same public exponent that locked it cannot reopen it — that asymmetry is the whole point."
                  : "Forgery is impossible without d, yet everyone can check authenticity with the public e."
                : "Applying the public key in reverse can't undo the private key's work — the trapdoor only runs one way."}
            </p>
          </div>
        </div>

        {/* attacker toggle */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="mono text-[10px] text-faint">
            {mode === "encrypt" ? "try to decrypt with the" : "try to verify-as-signer with the"}
          </span>
          <button
            onClick={() => setUseWrongKey(false)}
            className="mono text-[11px] rounded border px-3 py-1 transition-all"
            style={{
              borderColor: !useWrongKey ? "#3fb950" : "#1e2630",
              color: !useWrongKey ? "#56d364" : "#5b6b7d",
              background: !useWrongKey ? "#3fb9501a" : "transparent",
            }}
          >
            correct key ({correctUnlockKey.label})
          </button>
          <button
            onClick={() => setUseWrongKey(true)}
            className="mono text-[11px] rounded border px-3 py-1 transition-all"
            style={{
              borderColor: useWrongKey ? "#f85149" : "#1e2630",
              color: useWrongKey ? "#f85149" : "#5b6b7d",
              background: useWrongKey ? "#f851491a" : "transparent",
            }}
          >
            wrong key ({wrongUnlockKey.label})
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        toy RSA · n = p·q = 3·11 = {N} · public (n,e=3) · private d=7 · the factoring of n is the secret
      </p>
    </div>
  );
}
