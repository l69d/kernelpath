import type { Metadata } from "next";
import Link from "next/link";
import { PatchLifecycleViz } from "@/components/viz";

export const metadata: Metadata = {
  title: "The Contribution Playbook — From First Patch to Major Contribution",
  description:
    "A staged, practical playbook for going from your first trivial Linux kernel patch to a major, notable contribution — what to do, where to find work, the etiquette, and the long game.",
};

interface Stage {
  n: string;
  horizon: string;
  title: string;
  goal: string;
  color: string;
  points: { h: string; d: string }[];
}

const STAGES: Stage[] = [
  {
    n: "0",
    horizon: "Weeks 1–2",
    title: "Set up your forge",
    goal: "Be able to build, boot, and email a patch — before you write a single line.",
    color: "#39c5e0",
    points: [
      { h: "Build & boot in QEMU", d: "Compile the kernel from source and boot it in QEMU. It's fast, safe, and you can't brick your laptop. This is your iteration loop — make it tight." },
      { h: "Wire up git send-email", d: "Set your real name and a working git send-email. Kernel patches travel as plain-text email — not GitHub PRs. HTML mail is silently dropped by the lists." },
      { h: "Read the process docs", d: "Documentation/process/ — especially submitting-patches.rst, coding-style.rst, and “A guide to the Kernel Development Process.” This is the rulebook; reading it puts you ahead of 90% of first-timers." },
      { h: "Learn the scripts", d: "scripts/checkpatch.pl (style/correctness linter), scripts/get_maintainer.pl (who to CC), and the b4 tool (fetch & manage patch series from the lists)." },
      { h: "Subscribe via lore", d: "Pick one subsystem list plus LKML on lore.kernel.org and just read for a week. Absorb the rhythm, the tone, and what good patches look like." },
    ],
  },
  {
    n: "1",
    horizon: "Month 1",
    title: "Land your first patch",
    goal: "Get one small, genuinely-correct patch accepted. The first one is the hardest.",
    color: "#3fb950",
    points: [
      { h: "Pick a real, tiny fix", d: "A true bug or improvement — a checkpatch --strict warning that's actually wrong, a compiler warning under make W=1, a sparse warning, a deprecated-API replacement, or a documentation/comment error you verified." },
      { h: "Where to look", d: "drivers/staging/ has a gentler bar; the syzbot dashboard and bugzilla.kernel.org list real reproducible bugs; KernelNewbies has a “first patch” tutorial; the (archived) Eudyptula Challenge tasks are a superb structured ramp." },
      { h: "One change per patch", d: "Each patch does exactly one logical thing. The commit message explains WHY, not just what. End with your Signed-off-by line (the Developer's Certificate of Origin)." },
      { h: "Self-check before sending", d: "Run checkpatch.pl on your patch, build it (ideally W=1 and sparse), and read your own diff as a reviewer would. Catch it before they do." },
      { h: "Don't patch-farm", d: "Maintainers despise floods of trivial whitespace/typo patches sent for credit. One useful change beats fifty cosmetic ones — and protects your reputation from the start." },
    ],
  },
  {
    n: "2",
    horizon: "Months 2–6",
    title: "Pick a home & go deep",
    goal: "Become genuinely fluent in ONE subsystem instead of shallow everywhere.",
    color: "#bc8cff",
    points: [
      { h: "Choose a subsystem you care about", d: "A driver class for hardware you own, or a filesystem, networking, memory management (mm), or the scheduler. Caring about it is what carries you through the hard months." },
      { h: "Read code AND history", d: "git log -p teaches you why the code is the way it is. The mailing-list archives on lore show the arguments behind each design. Read both — the code is only half the story." },
      { h: "Build a toy to learn the APIs", d: "Write a small out-of-tree module: a character device, a platform driver. Internalize the data structures (task_struct, file_operations, sk_buff) by using them." },
      { h: "Watch it actually run", d: "ftrace, perf, and bpftrace turn the kernel from a black box into something you can observe. Add KUnit tests for the code you touch." },
      { h: "Review other people's patches", d: "The single fastest way to learn the bar — and to get noticed. A careful Reviewed-by / Tested-by on the list is valued and builds your name before you're a heavy committer." },
    ],
  },
  {
    n: "3",
    horizon: "Months 6–18",
    title: "Become a regular",
    goal: "Maintainers know your name and trust your work.",
    color: "#e3a93c",
    points: [
      { h: "Ship a steady stream", d: "A consistent flow of real, non-trivial fixes and small features in your subsystem. Consistency over heroics — reputation compounds patch by patch." },
      { h: "Handle review like a pro", d: "Address every comment. Send v2/v3 with a changelog under the --- line. Never argue from ego; the goal is the best patch, not being right." },
      { h: "Triage and bisect bugs", d: "Pick up syzbot reports and regressions. git bisect to find the culprit commit. Fixing others' bugs builds enormous goodwill with maintainers." },
      { h: "Help the next newcomer", d: "Answer questions on the list, review first-timers' patches. Becoming part of the community — not just a patch-sender — is what unlocks the bigger work." },
    ],
  },
  {
    n: "4",
    horizon: "The milestone",
    title: "Land something notable",
    goal: "A contribution people cite — the “major” one.",
    color: "#f778ba",
    points: [
      { h: "What “major” looks like", d: "A new driver for real hardware; a new feature, syscall, or ioctl; a measurable performance win backed by benchmarks; fixing a whole class of bugs; a new API or subsystem; a substantial Rust-for-Linux or eBPF addition." },
      { h: "Send an RFC first", d: "Float the design as an RFC to get directional buy-in BEFORE writing it all. It's far cheaper to change a paragraph than 4,000 lines after a maintainer says “no.”" },
      { h: "Justify with data", d: "For anything performance-related, bring numbers: before/after benchmarks, real workloads, the tradeoffs. “Trust me” doesn't merge; measurements do." },
      { h: "Split into a reviewable series", d: "A 4,000-line wall is unmergeable. Break it into a logical patch series, each independently reviewable, building up to the feature." },
      { h: "Persist through revisions", d: "Major work takes v5, v9, months. Expect pushback, line up Reviewed-by/Acked-by from the right people, and keep going. Persistence is the actual skill." },
    ],
  },
  {
    n: "5",
    horizon: "The long game",
    title: "Toward maintainer",
    goal: "Stewardship — years, not months.",
    color: "#56d364",
    points: [
      { h: "Trust is earned, then formalized", d: "Sustained quality plus reviewing earns it. Eventually you may co-maintain a driver or file — adding yourself to MAINTAINERS, carrying patches, and mentoring the people who are where you started." },
      { h: "Consistency beats brilliance", d: "Nobody becomes a maintainer in a sprint. The people who get there showed up, did careful work, and were good to work with — for years. That's the whole secret." },
    ],
  },
];

const DO = [
  "Send plain-text email with git send-email",
  "One logical change per patch",
  "Explain WHY in the commit message",
  "Run checkpatch.pl + build (W=1, sparse) first",
  "CC get_maintainer.pl people and the list",
  "Reply inline; trim quoted text",
  "Version patches: v2/v3 with a changelog under ---",
  "Add Signed-off-by (the DCO)",
  "Research prior art on lore.kernel.org",
  "Be patient and humble under review",
];

const DONT = [
  "Send HTML email (it's dropped silently)",
  "Bundle unrelated changes together",
  "Patch-farm trivial whitespace for credit",
  "Resend a new version with no changelog",
  "Argue from ego when reviewed",
  "Ping aggressively — wait ~1–2 weeks",
  "Break the build or skip testing",
  "Send a giant unreviewable mega-patch",
  "Top-post replies on the list",
  "Forget the Signed-off-by line",
];

const FINDWORK = [
  { name: "syzbot dashboard", url: "https://syzkaller.appspot.com/upstream", d: "Live, reproducible kernel bugs found by fuzzing — many beginner-friendly." },
  { name: "bugzilla.kernel.org", url: "https://bugzilla.kernel.org", d: "Reported bugs across subsystems; filter by component you know." },
  { name: "KernelNewbies", url: "https://kernelnewbies.org/FirstKernelPatch", d: "The canonical first-patch walkthrough and a friendly community." },
  { name: "drivers/staging", url: "https://www.kernel.org/doc/html/latest/process/2.Process.html", d: "The on-ramp area — a lower bar for cleanup and learning." },
  { name: "make W=1 / sparse / smatch", url: "https://docs.kernel.org/dev-tools/sparse.html", d: "The compiler and static analyzers hand you a to-do list of real warnings." },
  { name: "lore.kernel.org", url: "https://lore.kernel.org", d: "Searchable archive of every list — research how a change was discussed before." },
];

function Section({ id, eyebrow, title, children }: { id?: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-14">
      <div className="mono text-[11px] uppercase tracking-widest text-green mb-1">{eyebrow}</div>
      <h2 className="text-2xl font-bold tracking-tight mb-5">{title}</h2>
      {children}
    </section>
  );
}

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center gap-2 text-xs mono text-faint mb-4">
        <Link href="/" className="hover:text-text">roadmap</Link>
        <span>/</span>
        <span className="text-muted">contribute</span>
      </div>

      <h1 className="text-3xl md:text-5xl font-black tracking-tight">
        From your first patch to a{" "}
        <span className="text-green">major contribution</span>
      </h1>
      <p className="mt-4 text-muted max-w-2xl leading-relaxed">
        The roadmap teaches you the kernel. This is the other half: how you
        actually get your code into Linus&apos;s tree. It is a ladder, not a
        leap — every kernel maintainer alive started with one tiny, terrifying
        first patch. Here is the climb, stage by stage.
      </p>

      <div className="mt-6 card p-4 grid-bg">
        <p className="text-sm text-text leading-relaxed">
          <b className="text-green">The one mindset that matters:</b> this is a
          long game measured in months and years, and it runs on{" "}
          <b className="text-text">trust</b>. You are not buying your way in with
          a clever patch — you are building a reputation, one careful, honest,
          well-tested change at a time. Consistency beats brilliance. Be the
          person maintainers are glad to see in their inbox.
        </p>
      </div>

      {/* the ladder */}
      <Section eyebrow="the climb" title="Six stages from outsider to insider">
        <ol className="space-y-4">
          {STAGES.map((s) => (
            <li key={s.n}>
              <div
                className="card p-5"
                style={{ borderColor: s.color + "44" }}
              >
                <div className="flex items-start gap-4">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg mono text-base font-black"
                    style={{ background: s.color, color: "#06121a" }}
                  >
                    {s.n}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-lg font-bold" style={{ color: s.color }}>
                        {s.title}
                      </h3>
                      <span className="mono text-[11px] text-faint">{s.horizon}</span>
                    </div>
                    <p className="text-sm text-muted mt-1">{s.goal}</p>
                    <ul className="mt-3 space-y-2">
                      {s.points.map((p) => (
                        <li key={p.h} className="text-sm">
                          <span className="text-text font-semibold">{p.h}.</span>{" "}
                          <span className="text-muted">{p.d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* patch lifecycle viz */}
      <Section eyebrow="the mechanics" title="What actually happens to a patch">
        <p className="text-sm text-muted mb-4 max-w-2xl">
          Every contribution — your first typo fix and your eventual new driver —
          travels the same path from your laptop to the mainline tree. Step
          through it:
        </p>
        <PatchLifecycleViz />
      </Section>

      {/* dos and donts */}
      <Section eyebrow="etiquette" title="The tips & tricks that get patches accepted">
        <p className="text-sm text-muted mb-4 max-w-2xl">
          Most first patches are rejected for process, not code. Get these right
          and you instantly look like you belong.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-4">
            <div className="mono text-xs font-bold mb-3" style={{ color: "#3fb950" }}>
              ✓ DO
            </div>
            <ul className="space-y-2">
              {DO.map((d) => (
                <li key={d} className="text-sm text-muted flex gap-2">
                  <span style={{ color: "#3fb950" }}>+</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-4">
            <div className="mono text-xs font-bold mb-3" style={{ color: "#f85149" }}>
              ✗ DON&apos;T
            </div>
            <ul className="space-y-2">
              {DONT.map((d) => (
                <li key={d} className="text-sm text-muted flex gap-2">
                  <span style={{ color: "#f85149" }}>−</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* where to find first work */}
      <Section eyebrow="get started today" title="Where to find your first real task">
        <div className="grid sm:grid-cols-2 gap-3">
          {FINDWORK.map((f) => (
            <a
              key={f.name}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="card card-hover p-4 block"
            >
              <div className="mono text-sm font-bold text-cyan">{f.name} ↗</div>
              <p className="text-xs text-muted mt-1">{f.d}</p>
            </a>
          ))}
        </div>
      </Section>

      {/* what a major contribution looks like */}
      <Section eyebrow="the summit" title="What a notable contribution looks like">
        <div className="card p-5">
          <p className="text-sm text-muted leading-relaxed">
            A &ldquo;major&rdquo; contribution isn&apos;t one heroic patch — it&apos;s
            something the community comes to rely on. In recent years that has
            looked like: <b className="text-text">whole new drivers</b> for real
            hardware, the <b className="text-text">eBPF</b> programmable-kernel
            machinery, <b className="text-text">io_uring</b> async I/O,{" "}
            <b className="text-text">sched_ext</b> (pluggable schedulers in BPF),
            and the <b className="text-text">Rust-for-Linux</b> effort. None
            landed in one shot — each was an RFC, then a patch series, then v2…v15,
            then months of review. You get there by being the person who already
            shipped a hundred good small patches in that subsystem and earned the
            right to propose something big.
          </p>
        </div>
      </Section>

      {/* next */}
      <div className="mt-14 flex flex-col sm:flex-row gap-3">
        <Link
          href="/track/t10"
          className="flex-1 card card-hover p-5 block"
        >
          <div className="mono text-[11px] uppercase tracking-widest text-green mb-1">study the process</div>
          <div className="font-bold">Track 10 — The Contribution Process →</div>
          <p className="text-sm text-muted mt-1">The maintainer hierarchy, patch workflow, review, and the release cycle in depth.</p>
        </Link>
        <a
          href="https://docs.kernel.org/process/submitting-patches.html"
          target="_blank"
          rel="noreferrer"
          className="flex-1 card card-hover p-5 block"
        >
          <div className="mono text-[11px] uppercase tracking-widest text-cyan mb-1">the source of truth ↗</div>
          <div className="font-bold">Documentation/process/</div>
          <p className="text-sm text-muted mt-1">submitting-patches.rst and the kernel development process guide — read it before your first send.</p>
        </a>
      </div>
    </div>
  );
}
