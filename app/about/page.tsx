import Link from "next/link";
import type { Metadata } from "next";
import { TOTAL_MODULES, TOTAL_TRACKS, TRACKS } from "@/lib/modules";
import { trackColor, TRACK_INDEX } from "@/lib/ui";

export const metadata: Metadata = {
  title: "About & How To Use",
  description:
    "What KernelPath is, who it's for, how it's organized, and how to use it to go from absolute beginner to Linux kernel contributor.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-black tracking-tight">
        About <span className="text-green">KernelPath</span>
      </h1>
      <p className="mt-4 text-lg text-muted">
        A single source of truth for one of the most rewarding journeys in all of
        computing: learning enough to contribute to the Linux kernel — the
        software that runs on billions of phones, servers, cars, and
        supercomputers.
      </p>

      <Section title="Who this is for">
        <p>
          Anyone curious about how computers <em>really</em> work, especially
          younger learners and self-taught programmers. It assumes{" "}
          <strong>zero prior knowledge</strong> at the start — the first modules
          explain what a bit is and how a transistor switches — and builds, brick
          by brick, all the way to writing device drivers, fuzzing the kernel,
          and emailing your first patch to a maintainer.
        </p>
      </Section>

      <Section title="How it's organized">
        <p>
          {TOTAL_MODULES} modules across {TOTAL_TRACKS} tracks. The tracks are
          ordered so each builds on the last, but every module stands on its own
          with an overview, the core concepts (with real code), a diagram, common
          pitfalls, hands-on exercises, curated resources, and checkpoints.
        </p>
        <ol className="mt-4 space-y-2">
          {TRACKS.map((t) => (
            <li key={t.id} className="flex items-baseline gap-3">
              <span
                className="mono text-xs font-bold"
                style={{ color: trackColor(t.id) }}
              >
                {TRACK_INDEX[t.id]}
              </span>
              <Link
                href={`/track/${t.id}`}
                className="text-text hover:text-white"
              >
                {t.title}
              </Link>
              <span className="text-sm text-faint">— {t.blurb}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="How to use it">
        <ul className="space-y-2">
          <li>
            <strong>Go in order if you&apos;re new.</strong> Track 0 → Track 11 is
            a genuine curriculum. Don&apos;t skip the foundations; the kernel
            punishes hand-waving.
          </li>
          <li>
            <strong>Jump around if you&apos;re not.</strong> Already know C? Start
            at Computer Architecture or Kernel Internals. Use{" "}
            <kbd className="mono border border-border rounded px-1 text-xs">
              ⌘K
            </kbd>{" "}
            to search any topic.
          </li>
          <li>
            <strong>Build everything.</strong> Reading about a spinlock teaches
            you nothing. Do the exercises. Compile the code. Boot the kernel in
            QEMU.
          </li>
          <li>
            <strong>Mark modules complete</strong> as you finish them. Your
            progress is saved in your browser and shown on the{" "}
            <Link href="/progress" className="text-cyan">
              progress dashboard
            </Link>
            . Export it to back it up.
          </li>
        </ul>
      </Section>

      <Section title="The visualizations">
        <p>
          The hardest ideas in systems — virtual-memory translation, the CPU
          pipeline, protection rings, the syscall boundary, the patch lifecycle —
          come with hand-built, interactive visualizations you can poke at. Every
          other module includes a generated diagram so there&apos;s always
          something to <em>see</em>, not just read.
        </p>
      </Section>

      <Section title="How it was built">
        <p>
          The curriculum content was authored by a fleet of{" "}
          <strong>over 100 AI agents working in parallel</strong> — one per
          module — each acting as a specialist educator, then assembled into this
          site (Next.js, deployed on Vercel). It&apos;s open source and MIT
          licensed; corrections and additions are welcome on{" "}
          <a
            href="https://github.com/l69d/kernelpath"
            target="_blank"
            rel="noreferrer"
            className="text-cyan"
          >
            GitHub
          </a>
          .
        </p>
      </Section>

      <Section title="The best canonical sources">
        <p>When in doubt, these are the references the pros actually use:</p>
        <ul className="mt-3 space-y-1.5">
          {[
            ["The Linux Kernel docs", "https://docs.kernel.org"],
            ["LWN.net (the kernel newspaper)", "https://lwn.net"],
            ["KernelNewbies", "https://kernelnewbies.org"],
            ["Bootlin training materials", "https://bootlin.com/docs/"],
            ["Linux source, browsable", "https://elixir.bootlin.com"],
            ["OSTEP — free OS textbook", "https://ostep.org"],
            ["Compiler Explorer (Godbolt)", "https://godbolt.org"],
          ].map(([label, href]) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-cyan hover:underline"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <div className="mt-12 card p-6 text-center grid-bg">
        <p className="text-muted">Ready?</p>
        <Link
          href="/module/t0-01"
          className="inline-block mt-3 rounded-lg bg-green px-6 py-3 font-semibold text-[#06121a] hover:bg-green-bright transition-colors"
        >
          Start at module 01 →
        </Link>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold mb-3">{title}</h2>
      <div className="prose-kp text-muted">{children}</div>
    </section>
  );
}
