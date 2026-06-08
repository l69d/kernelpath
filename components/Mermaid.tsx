"use client";

import { useEffect, useId, useRef, useState } from "react";

interface Props {
  code: string;
  className?: string;
}

let initialized = false;

export default function Mermaid({ code, className }: Props) {
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        if (!initialized) {
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: "base",
            fontFamily:
              "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
            themeVariables: {
              background: "#0b0f15",
              primaryColor: "#10151d",
              primaryBorderColor: "#2b3a49",
              primaryTextColor: "#d6dee8",
              secondaryColor: "#161c26",
              tertiaryColor: "#0b0f15",
              lineColor: "#46566a",
              fontSize: "14px",
              clusterBkg: "#0d1219",
              clusterBorder: "#243040",
              nodeBorder: "#2b3a49",
              mainBkg: "#10151d",
              edgeLabelBackground: "#0b0f15",
              actorBkg: "#10151d",
              actorBorder: "#2b3a49",
              actorTextColor: "#d6dee8",
              signalColor: "#8a97a8",
              signalTextColor: "#d6dee8",
              labelBoxBkgColor: "#10151d",
              labelBoxBorderColor: "#2b3a49",
              noteBkgColor: "#1b2330",
              noteBorderColor: "#39c5e0",
              noteTextColor: "#d6dee8",
            },
          });
          initialized = true;
        }
        const id = `mmd-${reactId}`;
        const { svg: out } = await mermaid.render(id, code.trim());
        if (!cancelled) {
          setSvg(out);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to render diagram",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, reactId]);

  if (error) {
    return (
      <div className={className}>
        <pre className="mono text-xs overflow-x-auto rounded-lg border border-border bg-bg p-4 text-muted">
          {code.trim()}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        className={`mono text-xs text-faint grid place-items-center min-h-[140px] ${className ?? ""}`}
      >
        rendering diagram…
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`mermaid-wrap flex justify-center ${className ?? ""}`}
      // svg produced by mermaid (securityLevel: strict sanitizes it)
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
