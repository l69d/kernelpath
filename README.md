<div align="center">

# KernelPath

### From first principles to the Linux kernel.

**An exhaustive, visual, free roadmap — 112 modules across 12 tracks — that takes a curious beginner from "what is a bit?" all the way to sending a patch to the Linux kernel mailing list.**

[**Live site → kernelpath.vercel.app**](https://kernelpath.vercel.app)

</div>

---

## What this is

KernelPath is a single source of truth for one of the most rewarding journeys in
computing: learning enough to contribute to the Linux kernel — the software that
runs on billions of phones, servers, cars, and the world's supercomputers.

It assumes **zero prior knowledge** at the start (the first modules explain bits,
logic gates, and transistors) and builds, brick by brick, through C, computer
architecture, assembly, operating-systems theory, the Linux userland, the
developer toolchain, kernel internals, device drivers, hands-on kernel hacking,
the contribution process, and finally the cutting edge (eBPF, Rust for Linux,
io_uring, sched_ext).

Every module has:

- a plain-English **overview** and a *why it matters for the kernel* note
- the core **concepts**, each with real, runnable code (C, assembly, shell, kernel C)
- a **diagram** (and, for the hardest topics, a hand-built **interactive visualization**)
- **common pitfalls**, hands-on **exercises** with hints, and **checkpoints**
- curated, canonical **resources** (free and paid) with links

Your **progress** is tracked locally in your browser, shown across the whole
roadmap, and can be exported/imported as JSON.

## The 12 tracks

| # | Track | |
|---|-------|---|
| 00 | Foundations of Computing | bits, gates, transistors, the memory hierarchy |
| 01 | C Programming Mastery | the language the kernel is written in |
| 02 | Computer Architecture & Microprocessors | what your code actually runs on |
| 03 | Assembly & the Machine | x86-64, AArch64, RISC-V |
| 04 | Operating Systems Theory | the timeless ideas every kernel implements |
| 05 | Linux as a System | shell, processes, permissions, networking |
| 06 | Tools of the Trade | git, gcc, gdb, make, perf, QEMU |
| 07 | Linux Kernel Internals | scheduler, mm, VFS, RCU, the network stack |
| 08 | Device Drivers | where the kernel meets hardware |
| 09 | Kernel Development Practice | build, boot, test, debug your own kernel |
| 10 | Contributing to Linux | the patch, the list, the maintainer |
| 11 | The Cutting Edge | eBPF, Rust, io_uring, KVM, containers, sched_ext |

## Tech

- **Next.js 16** (App Router, fully static SSG) + **React 19**
- **Tailwind CSS v4**
- **mermaid** for per-module diagrams, hand-built React/SVG for hero visualizations
- **react-markdown** + **rehype-highlight** for content & code
- progress persisted in `localStorage`
- deployed on **Vercel**

## How the content was built

The curriculum content was authored by a fleet of **100+ AI agents working in
parallel** — one specialist educator per module — then assembled into
`content/content.json` and rendered by the site. The curriculum *structure*
(tracks, modules, ordering) lives in `lib/modules.ts`.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (static export of 130 pages)
```

## Contributing

Corrections, better explanations, new resources, and new modules are very
welcome. Open an issue or a PR. MIT licensed.

---

<div align="center">
<sub>112 modules between you and Ring 0.</sub>
</div>
