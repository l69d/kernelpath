import Link from "next/link";
import { TOTAL_MODULES, TOTAL_TRACKS } from "@/lib/modules";

const GITHUB = "https://github.com/l69d/kernelpath";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded border border-green/40 bg-green/10 mono text-[10px] font-bold text-green">
              R0
            </span>
            <span className="font-bold">
              Kernel<span className="text-green">Path</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-muted max-w-xs">
            From the first transistor to your first merged patch. A free, open
            roadmap of {TOTAL_MODULES} modules across {TOTAL_TRACKS} tracks.
          </p>
        </div>

        <div className="text-sm">
          <div className="mono text-[11px] uppercase tracking-widest text-faint mb-3">
            Navigate
          </div>
          <ul className="space-y-2 text-muted">
            <li><Link href="/" className="hover:text-text">The Roadmap</Link></li>
            <li><Link href="/sandbox" className="hover:text-text">The Sandbox</Link></li>
            <li><Link href="/progress" className="hover:text-text">Track Your Progress</Link></li>
            <li><Link href="/about" className="hover:text-text">About & How To Use</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <div className="mono text-[11px] uppercase tracking-widest text-faint mb-3">
            Canonical sources
          </div>
          <ul className="space-y-2 text-muted">
            <li><a href="https://docs.kernel.org" target="_blank" rel="noreferrer" className="hover:text-text">docs.kernel.org</a></li>
            <li><a href="https://lwn.net" target="_blank" rel="noreferrer" className="hover:text-text">LWN.net</a></li>
            <li><a href="https://kernelnewbies.org" target="_blank" rel="noreferrer" className="hover:text-text">KernelNewbies</a></li>
            <li><a href="https://bootlin.com/docs/" target="_blank" rel="noreferrer" className="hover:text-text">Bootlin training</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-faint">
          <span>
            Built as a single source of truth for aspiring kernel hackers. MIT
            licensed.
          </span>
          <a href={GITHUB} target="_blank" rel="noreferrer" className="hover:text-text mono">
            github.com/l69d/kernelpath
          </a>
        </div>
      </div>
    </footer>
  );
}
