// ------------------------------------------------------------------ //
//  KernelPath — canonical curriculum STRUCTURE (metadata only).
//  This is the single source of truth for tracks, modules & ordering.
//  Rich per-module teaching content lives in content/content.json and
//  is merged in lib/content.ts (server-only).
// ------------------------------------------------------------------ //

export type Part = "kernel" | "cs";

export interface Track {
  id: string;
  title: string;
  blurb: string;
  /** Which part of the curriculum this track belongs to. Defaults to "kernel". */
  part?: Part;
}

export const PARTS: { id: Part; title: string; tagline: string }[] = [
  {
    id: "kernel",
    title: "Part I · The Kernel Path",
    tagline: "From transistors to your first merged Linux kernel patch.",
  },
  {
    id: "cs",
    title: "Part II · The CS Core",
    tagline: "A full 4-year MIT / Stanford computer-science curriculum.",
  },
];

export function partOf(t: Track): Part {
  return t.part ?? "kernel";
}

export function tracksInPart(part: Part): Track[] {
  return TRACKS.filter((t) => partOf(t) === part);
}

export interface ModuleMeta {
  id: string;
  track: string;
  title: string;
  brief: string;
}

export const TRACKS: Track[] = [
  { id: "t0", title: "Foundations of Computing", blurb: "How a machine computes at all — from transistors to running programs." },
  { id: "t1", title: "C Programming Mastery", blurb: "The language the kernel is written in, learned to the bone." },
  { id: "t2", title: "Computer Architecture & Microprocessors", blurb: "What your code actually runs on." },
  { id: "t3", title: "Assembly & the Machine", blurb: "Talking to the CPU in its own words." },
  { id: "t4", title: "Operating Systems Theory", blurb: "The timeless ideas every kernel implements." },
  { id: "t5", title: "Linux as a System", blurb: "Mastering Linux as a power user and systems programmer." },
  { id: "t6", title: "Tools of the Trade", blurb: "Git, GCC, GDB, Make, perf, QEMU — a kernel hacker's toolbox." },
  { id: "t7", title: "Linux Kernel Internals", blurb: "Inside the world's most important codebase." },
  { id: "t8", title: "Device Drivers", blurb: "Where the kernel meets real hardware." },
  { id: "t9", title: "Kernel Development Practice", blurb: "Build, boot, test, and debug your own kernel." },
  { id: "t10", title: "Contributing to Linux", blurb: "The patch, the mailing list, the maintainer — getting code merged." },
  { id: "t11", title: "The Cutting Edge", blurb: "eBPF, Rust, io_uring, and the future of the kernel." },

  // ---- Part II: The CS Core (MIT 6-3 / Stanford CS curriculum) ----
  { id: "cs0", part: "cs", title: "Mathematics for Computer Science", blurb: "Discrete math: the logic, proofs and structures all of CS is built on." },
  { id: "cs1", part: "cs", title: "Linear Algebra, Calculus & Probability", blurb: "The continuous math that powers graphics, ML and theory." },
  { id: "cs2", part: "cs", title: "Programming Abstractions & Paradigms", blurb: "How to think in abstractions — functional, OOP, interpreters." },
  { id: "cs3", part: "cs", title: "Data Structures", blurb: "The containers that make algorithms possible." },
  { id: "cs4", part: "cs", title: "Algorithms", blurb: "Designing and analyzing efficient solutions." },
  { id: "cs5", part: "cs", title: "Theory of Computation & Complexity", blurb: "What can be computed, and how hard it is." },
  { id: "cs6", part: "cs", title: "Programming Languages", blurb: "Semantics, type systems and the lambda calculus." },
  { id: "cs7", part: "cs", title: "Compilers", blurb: "Turning source code into machine code, stage by stage." },
  { id: "cs8", part: "cs", title: "Databases", blurb: "Storing, querying and protecting data at scale." },
  { id: "cs9", part: "cs", title: "Computer Networks", blurb: "How the Internet actually moves bits." },
  { id: "cs10", part: "cs", title: "Distributed Systems", blurb: "Many computers, one system — consensus, replication, fault tolerance." },
  { id: "cs11", part: "cs", title: "Artificial Intelligence", blurb: "Search, logic, planning and reasoning under uncertainty." },
  { id: "cs12", part: "cs", title: "Machine Learning", blurb: "Learning from data: the classical ML toolkit." },
  { id: "cs13", part: "cs", title: "Deep Learning & Modern AI", blurb: "Neural networks, transformers and generative models." },
  { id: "cs14", part: "cs", title: "Security & Cryptography", blurb: "Attacking and defending systems; the math of secrets." },
  { id: "cs15", part: "cs", title: "Computer Graphics & Vision", blurb: "Making and understanding images." },
  { id: "cs16", part: "cs", title: "Software Engineering & Systems Design", blurb: "Building software that lasts and scales." },
  { id: "cs17", part: "cs", title: "HCI, Ethics & the Profession", blurb: "Computing for, and about, humans." },
];

export const MODULES: ModuleMeta[] = [
  // Track 0 — Foundations
  { id: "t0-01", track: "t0", title: "What Is Computation? Bits, Bytes, Binary & Hex", brief: "Bits and bytes, binary and hexadecimal, why computers are binary, place value, converting between bases, the byte as the fundamental unit." },
  { id: "t0-02", track: "t0", title: "Boolean Logic & Logic Gates", brief: "Boolean algebra, truth tables, De Morgan's laws, universal gates, how gates compose into adders, multiplexers and latches." },
  { id: "t0-03", track: "t0", title: "From Transistors to Gates (CMOS)", brief: "Transistors as switches, MOSFETs, CMOS gate construction, how billions of transistors form a CPU, Moore's law and process nodes." },
  { id: "t0-04", track: "t0", title: "Number Systems & Two's Complement", brief: "Signed vs unsigned, two's complement and why it wins, overflow, sign extension, bit width and ranges." },
  { id: "t0-05", track: "t0", title: "Data Representation: Integers, Floats, Text", brief: "Integer encodings, IEEE-754 floating point, ASCII, Unicode, UTF-8, and endianness." },
  { id: "t0-06", track: "t0", title: "The Von Neumann Architecture", brief: "Stored-program concept, the CPU/memory/I-O split, the von Neumann bottleneck, Harvard architecture." },
  { id: "t0-07", track: "t0", title: "The Memory Hierarchy", brief: "Registers, caches, RAM, disk; latency vs capacity tradeoffs; locality of reference; the numbers every programmer should know." },
  { id: "t0-08", track: "t0", title: "How a Program Runs: Source to Execution", brief: "The full pipeline: source -> preprocessor -> compiler -> assembler -> linker -> loader -> process." },

  // Track 1 — C
  { id: "t1-01", track: "t1", title: "C Toolchain & Translation Phases", brief: "First program, the phases of translation, gcc/clang flags, object files, why C is the systems language." },
  { id: "t1-02", track: "t1", title: "Types, Variables, Operators", brief: "Fundamental and fixed-width types, integer promotion, conversions, operator precedence, const/volatile, scope and lifetime." },
  { id: "t1-03", track: "t1", title: "Control Flow & Functions", brief: "if/switch/loops, goto and its legit kernel uses, functions, parameter passing, recursion, the call stack." },
  { id: "t1-04", track: "t1", title: "Pointers: The Heart of C", brief: "Address-of and dereference, pointer types, null, pointers-to-pointers, const-correctness, why pointers matter for the kernel." },
  { id: "t1-05", track: "t1", title: "Arrays, Strings & Pointer Arithmetic", brief: "Array-pointer decay, pointer arithmetic, C strings, multidimensional arrays, buffer overflows." },
  { id: "t1-06", track: "t1", title: "Dynamic Memory: malloc, free & the Heap", brief: "Heap vs stack, malloc/free, leaks, use-after-free, double-free, fragmentation, how allocators work." },
  { id: "t1-07", track: "t1", title: "The Stack, Calling Conventions & Stack Frames", brief: "Stack frame layout, return address, saved registers, locals, stack growth, calling conventions, stack overflow." },
  { id: "t1-08", track: "t1", title: "Structs, Unions, Enums & Bitfields", brief: "Aggregate types, padding/alignment, packed structs, unions, bitfields, and the container_of trick." },
  { id: "t1-09", track: "t1", title: "Function Pointers & Callbacks", brief: "Function pointer syntax, callbacks, dispatch tables, and how the kernel uses ops structs like file_operations." },
  { id: "t1-10", track: "t1", title: "The C Preprocessor & Macros", brief: "Include/define/conditional compilation, function-like macros, stringizing, token pasting, kernel macro idioms." },
  { id: "t1-11", track: "t1", title: "Multi-file Projects, Linkage & Storage Classes", brief: "Headers vs source, translation units, extern/static, internal vs external linkage, declaration vs definition." },
  { id: "t1-12", track: "t1", title: "Undefined Behavior & the C Memory Model", brief: "UB/IB/unspecified, strict aliasing, sequence points, signed overflow, why UB matters for security and the kernel." },
  { id: "t1-13", track: "t1", title: "Bit Manipulation Techniques", brief: "Masks, shifts, set/clear/toggle/test bits, bit hacks, flags, bitmaps, and kernel bitops helpers." },
  { id: "t1-14", track: "t1", title: "Debugging C: GDB, Valgrind & Sanitizers", brief: "GDB workflow, Valgrind, ASan/UBSan, reading core dumps, and the debugging mindset." },

  // Track 2 — Architecture
  { id: "t2-01", track: "t2", title: "CPU Anatomy: ALU, Registers, Control Unit, Datapath", brief: "Inside a core: ALU, register file, control unit, program counter, the datapath and the clock." },
  { id: "t2-02", track: "t2", title: "ISAs: RISC vs CISC, x86 / ARM / RISC-V", brief: "What an ISA is, RISC vs CISC, x86-64 vs AArch64 vs RISC-V, architecture vs microarchitecture." },
  { id: "t2-03", track: "t2", title: "The Fetch-Decode-Execute Cycle", brief: "The instruction cycle in detail, micro-operations, instruction encoding and decoding." },
  { id: "t2-04", track: "t2", title: "Pipelining", brief: "Pipeline stages, throughput vs latency, ideal speedup, pipeline registers, the laundry analogy." },
  { id: "t2-05", track: "t2", title: "Hazards & Branch Prediction", brief: "Structural/data/control hazards, forwarding, stalls, branch prediction, misprediction penalty." },
  { id: "t2-06", track: "t2", title: "Superscalar, Out-of-Order & Speculative Execution", brief: "Multiple issue, OoO execution, register renaming, the reorder buffer, speculation." },
  { id: "t2-07", track: "t2", title: "Caches Deep Dive: Associativity & Coherence", brief: "Cache lines, associativity, replacement, write policies, the 3 Cs, MESI coherence, false sharing." },
  { id: "t2-08", track: "t2", title: "Virtual Memory, the MMU, TLB & Paging", brief: "Virtual vs physical addresses, page tables, multi-level paging, the MMU, the TLB, page faults." },
  { id: "t2-09", track: "t2", title: "Privilege Levels, Protection Rings & CPU Modes", brief: "Ring 0-3, kernel vs user mode, mode switches, x86 rings vs ARM exception levels, the syscall boundary in hardware." },
  { id: "t2-10", track: "t2", title: "Interrupts, Exceptions & Traps", brief: "Hardware interrupts, the APIC, exceptions/faults/traps, the IDT, interrupt latency, saving CPU state." },
  { id: "t2-11", track: "t2", title: "I/O: MMIO, Port I/O, DMA & Buses (PCIe)", brief: "Memory-mapped vs port I/O, DMA and bus mastering, PCIe, device enumeration, MSI/MSI-X interrupts." },
  { id: "t2-12", track: "t2", title: "Multicore, SMP, NUMA & Memory Models", brief: "SMP vs NUMA, coherence at scale, memory consistency models, barriers, and hardware atomics." },

  // Track 3 — Assembly
  { id: "t3-01", track: "t3", title: "x86-64 Assembly Basics", brief: "The register set, AT&T vs Intel syntax, core instructions, addressing modes, a hand-written program." },
  { id: "t3-02", track: "t3", title: "ARM / AArch64 Assembly Basics", brief: "The AArch64 register set, load/store architecture, condition flags, and why ARM rules mobile and embedded." },
  { id: "t3-03", track: "t3", title: "Calling Conventions & ABIs (System V)", brief: "The System V AMD64 ABI, argument registers, return values, caller/callee-saved registers, the red zone." },
  { id: "t3-04", track: "t3", title: "Reading Compiler Output (Godbolt)", brief: "Using Compiler Explorer, mapping C to assembly, seeing optimizations, spotting UB exploitation." },
  { id: "t3-05", track: "t3", title: "Inline Assembly in C", brief: "GCC extended asm, operands and clobbers, volatile asm, and where the kernel uses inline assembly." },
  { id: "t3-06", track: "t3", title: "RISC-V Assembly: The Open ISA", brief: "RISC-V philosophy and modularity, the base integer ISA, registers, and why it matters for the kernel's port." },

  // Track 4 — OS Theory
  { id: "t4-01", track: "t4", title: "What Is an OS? Kernel vs Userspace", brief: "The OS as resource manager and abstraction layer, the dual-mode model, what services an OS provides." },
  { id: "t4-02", track: "t4", title: "Processes & the Process Model", brief: "What a process is, the PCB, process states, address space, context switching, the fork/exec model." },
  { id: "t4-03", track: "t4", title: "Threads & Concurrency", brief: "Threads vs processes, user vs kernel threads, M:N models, shared memory hazards, why concurrency is hard." },
  { id: "t4-04", track: "t4", title: "CPU Scheduling", brief: "Preemptive vs cooperative, scheduling goals, FCFS/SJF/RR/priority/MLFQ, fairness, latency vs throughput." },
  { id: "t4-05", track: "t4", title: "Inter-Process Communication (IPC)", brief: "Pipes, message queues, shared memory, signals, sockets, and their tradeoffs." },
  { id: "t4-06", track: "t4", title: "Synchronization: Locks, Mutexes, Semaphores", brief: "Critical sections, mutual exclusion, mutexes/spinlocks/semaphores/condition variables, producer-consumer." },
  { id: "t4-07", track: "t4", title: "Deadlock & Race Conditions", brief: "Races, deadlock and the four Coffman conditions, livelock, starvation, prevention, lock ordering." },
  { id: "t4-08", track: "t4", title: "Memory Management: Allocation, Paging, Segmentation", brief: "Physical allocation, fragmentation, paging vs segmentation, buddy/free-list allocators." },
  { id: "t4-09", track: "t4", title: "Virtual Memory, Demand Paging & Page Replacement", brief: "Demand paging, page faults, working set, thrashing, FIFO/LRU/clock, swap, copy-on-write, overcommit." },
  { id: "t4-10", track: "t4", title: "File Systems Concepts", brief: "Files and directories, inodes, metadata, allocation strategies, journaling, mounting." },
  { id: "t4-11", track: "t4", title: "I/O Subsystems & Device Management", brief: "Block vs character devices, drivers conceptually, buffering and caching, polling vs interrupts vs DMA." },
  { id: "t4-12", track: "t4", title: "System Calls & the User/Kernel Boundary", brief: "What a syscall is, the trap mechanism, syscall vs library function, the cost of crossing the boundary, vDSO." },
  { id: "t4-13", track: "t4", title: "Kernel Architectures: Monolithic vs Microkernel vs Hybrid", brief: "Monolithic vs microkernel vs hybrid, the Tanenbaum-Torvalds debate, the tradeoffs, exokernels and unikernels." },
  { id: "t4-14", track: "t4", title: "The Boot Process: Firmware to init", brief: "Power-on, BIOS vs UEFI, the bootloader, loading the kernel, initramfs, PID 1, the full boot chain." },

  // Track 5 — Linux as a system
  { id: "t5-01", track: "t5", title: "Linux History, Philosophy, Distros & Licensing", brief: "Unix heritage, GNU, Linus and 1991, kernel vs GNU/Linux, distributions, GPLv2 and copyleft." },
  { id: "t5-02", track: "t5", title: "The Shell & Command-Line Mastery", brief: "Bash, pipes and redirection, globbing, job control, scripting, grep/sed/awk/find, the Unix philosophy." },
  { id: "t5-03", track: "t5", title: "The Filesystem Hierarchy & Everything Is a File", brief: "The FHS, the everything-is-a-file philosophy, file descriptors, /proc and /sys as kernel interfaces." },
  { id: "t5-04", track: "t5", title: "Processes & Signals in Linux", brief: "ps/top/htop, /proc/<pid>, the process tree, signals, kill, handlers, zombies and orphans, nice." },
  { id: "t5-05", track: "t5", title: "Users, Permissions & Capabilities", brief: "UID/GID, file permissions, setuid/setgid/sticky, root, POSIX capabilities, least privilege." },
  { id: "t5-06", track: "t5", title: "systemd & Init Systems", brief: "PID 1's job, SysV init vs systemd, units/services/targets, journald, socket activation." },
  { id: "t5-07", track: "t5", title: "Linux Networking from Userspace", brief: "The socket API, TCP/IP basics, ip/ss/tcpdump, netfilter/nftables, network namespaces, packet flow." },
  { id: "t5-08", track: "t5", title: "Package Management & Building from Source", brief: "apt/dnf/pacman, the configure/make/make-install dance, dependencies, why distros patch." },

  // Track 6 — Tools
  { id: "t6-01", track: "t6", title: "Git Deep: The Kernel's Workflow", brief: "Git internals, branching/merging/rebasing, the DAG, format-patch and send-email, bisect." },
  { id: "t6-02", track: "t6", title: "GCC & Clang: Compilation Deep Dive", brief: "Optimization levels, useful flags, warnings, sanitizers, LTO, attributes, GCC vs Clang for the kernel." },
  { id: "t6-03", track: "t6", title: "Make & the Kernel Build System (Kbuild/Kconfig)", brief: "Make fundamentals, Kbuild, Kconfig and menuconfig, defconfig, how the kernel image is produced." },
  { id: "t6-04", track: "t6", title: "GDB & Kernel Debugging (kgdb/KASAN)", brief: "GDB advanced, remote debugging, kgdb/kdb, debugging a kernel under QEMU, the crash utility." },
  { id: "t6-05", track: "t6", title: "The ELF Format & Binary Tools", brief: "ELF structure, objdump/readelf/nm/strip, relocation, sections vs segments, vmlinux." },
  { id: "t6-06", track: "t6", title: "Linkers & Loaders Deep", brief: "Static vs dynamic linking, symbol resolution, the GOT/PLT, ld.so, linker scripts (used in the kernel)." },
  { id: "t6-07", track: "t6", title: "Tracing & Profiling: ftrace, perf, strace, ltrace", brief: "strace/ltrace, perf, ftrace and the tracing infrastructure, flame graphs, tracepoints, kprobes." },
  { id: "t6-08", track: "t6", title: "QEMU & Virtualization for Kernel Dev", brief: "Why you develop kernels in a VM, QEMU basics, a minimal rootfs, gdb over QEMU, the fast iteration loop." },

  // Track 7 — Kernel internals
  { id: "t7-01", track: "t7", title: "The Kernel Source Tree Layout", brief: "Top-level directories, where things live, navigating 30M+ lines, cscope/ctags/elixir.bootlin." },
  { id: "t7-02", track: "t7", title: "Kernel Coding Style & Conventions", brief: "The coding-style doc, error handling with goto, no floating point, no userspace libc, checkpatch.pl." },
  { id: "t7-03", track: "t7", title: "Kernel Data Structures", brief: "Intrusive list_head, container_of, red-black trees, hash tables, xarray, kfifo, idr, per-cpu." },
  { id: "t7-04", track: "t7", title: "Kernel Memory: Buddy, Slab, kmalloc/vmalloc", brief: "The buddy allocator, zones, slab/slub, kmalloc vs vmalloc vs alloc_pages, GFP flags, the page struct." },
  { id: "t7-05", track: "t7", title: "Process Management: task_struct, fork, exec", brief: "task_struct anatomy, the process tree, fork/clone/exec in the kernel, kthreads, do_exit." },
  { id: "t7-06", track: "t7", title: "The Linux Scheduler: CFS, EEVDF & Scheduling Classes", brief: "Scheduling classes, CFS and the move to EEVDF, runqueues, load balancing, vruntime, preemption." },
  { id: "t7-07", track: "t7", title: "System Call Implementation in the Kernel", brief: "SYSCALL_DEFINE macros, the syscall table, copy_to/from_user, adding a syscall, ABI stability." },
  { id: "t7-08", track: "t7", title: "Interrupt Handling: Top/Bottom Halves, softirqs, workqueues", brief: "IRQ handlers, top vs bottom half, softirqs, tasklets, workqueues, threaded IRQs, request_irq." },
  { id: "t7-09", track: "t7", title: "Kernel Synchronization: Spinlocks, RCU, Atomics, Barriers", brief: "Spinlocks vs mutexes, atomic_t, memory barriers, RCU, seqlocks, per-cpu, lockdep." },
  { id: "t7-10", track: "t7", title: "The Virtual File System (VFS) Layer", brief: "The VFS abstraction, superblock/inode/dentry/file, file_operations, path lookup, one open() to a filesystem." },
  { id: "t7-11", track: "t7", title: "The Block Layer & I/O Scheduling", brief: "bio structures, request queues, blk-mq, I/O schedulers, how a read reaches the disk." },
  { id: "t7-12", track: "t7", title: "The Page Cache & Memory Reclaim", brief: "The page cache, dirty pages and writeback, the LRU lists, kswapd, direct reclaim, the OOM killer." },
  { id: "t7-13", track: "t7", title: "Networking Stack Internals", brief: "sk_buff, the netdev model, NAPI, the protocol layers, the journey of a packet through the kernel." },
  { id: "t7-14", track: "t7", title: "Time, Timers & the Kernel", brief: "jiffies, HZ, the tick, hrtimers, clocksource/clockevents, tickless operation, timekeeping." },
  { id: "t7-15", track: "t7", title: "Kernel Modules (LKM) Lifecycle", brief: "module_init/exit, insmod/rmmod/modprobe, EXPORT_SYMBOL, module params, signed modules, MODULE_LICENSE." },
  { id: "t7-16", track: "t7", title: "Kernel Debugging: Oops, Panic & Crash Analysis", brief: "Reading an oops/panic, decoding the stack, addr2line, kdump/crash, BUG/WARN, printk levels, taint flags." },

  // Track 8 — Drivers
  { id: "t8-01", track: "t8", title: "The Linux Driver Model", brief: "The device/driver/bus abstraction, struct device, sysfs, probe/remove, the kobject core, binding." },
  { id: "t8-02", track: "t8", title: "Character Device Drivers", brief: "cdev, major/minor numbers, file_operations, copy_to/from_user, a working char driver, miscdevice." },
  { id: "t8-03", track: "t8", title: "Block Device Drivers", brief: "gendisk, request handling, the block I/O path from a driver's view, a minimal ramdisk driver." },
  { id: "t8-04", track: "t8", title: "Platform Devices & the Device Tree", brief: "Non-discoverable buses, platform_driver, the device tree (DTS/DTB), of_match_table, why embedded needs it." },
  { id: "t8-05", track: "t8", title: "Interrupt Handling in Drivers", brief: "request_irq/free_irq, handlers, shared and threaded IRQs, the top/bottom-half split in a driver." },
  { id: "t8-06", track: "t8", title: "Concurrency & Locking in Drivers", brief: "Races in drivers, spinlock vs mutex, interrupt-safe locking, atomic context rules, reentrancy." },
  { id: "t8-07", track: "t8", title: "Accessing Hardware: MMIO & ioremap", brief: "ioremap, readl/writel, barriers for MMIO, the DMA mapping API, bus vs physical addresses." },
  { id: "t8-08", track: "t8", title: "Writing Your First Real Driver", brief: "End-to-end: a small but real driver, probe, sysfs attributes, a char interface, testing it." },

  // Track 9 — Practice
  { id: "t9-01", track: "t9", title: "Building, Configuring & Installing a Custom Kernel", brief: "Getting the source, defconfig/menuconfig, building, installing, booting your own kernel, localmodconfig." },
  { id: "t9-02", track: "t9", title: "Your First Kernel Module: Hello, World", brief: "A complete hello-world LKM, the Makefile, out-of-tree build, insmod/dmesg/rmmod, the build-test-debug loop." },
  { id: "t9-03", track: "t9", title: "Kernel Testing: kselftests, KUnit & syzkaller", brief: "kselftest, KUnit, why tests matter, fuzzing with syzkaller/syzbot, KTAP, testing in the contribution flow." },
  { id: "t9-04", track: "t9", title: "Static Analysis & Sanitizers: sparse, smatch, KASAN, lockdep", brief: "sparse annotations, smatch, coccinelle, KASAN/KCSAN/UBSAN, lockdep, kmemleak, reading their reports." },

  // Track 10 — Contributing
  { id: "t10-01", track: "t10", title: "The Kernel Community & Maintainer Hierarchy", brief: "The maintainer model, MAINTAINERS, subsystem trees, get_maintainer.pl, the lieutenants, list culture." },
  { id: "t10-02", track: "t10", title: "The Patch Workflow: format-patch, send-email, checkpatch", brief: "A clean commit, format-patch, checkpatch.pl, send-email setup, subject/changelog conventions, patch series." },
  { id: "t10-03", track: "t10", title: "Finding Your First Contribution", brief: "KernelNewbies first patch, drivers/staging, TODO files, Bugzilla, syzbot bugs, scratch your own itch." },
  { id: "t10-04", track: "t10", title: "Reviewing, Feedback & Patch Versions", brief: "Responding to review, plain-text replies, v2/v3, the changelog below ---, Reviewed/Acked/Tested-by, patience." },
  { id: "t10-05", track: "t10", title: "The Release Cycle: Merge Window, -rc, linux-next", brief: "The ~9-week cycle, the merge window, -rc releases, subsystem trees, linux-next, stable/LTS." },
  { id: "t10-06", track: "t10", title: "DCO, Signed-off-by & Documentation Contributions", brief: "The Developer Certificate of Origin, Signed-off-by chains, no CLA, SPDX tags, docs as an entry point." },

  // Track 11 — Cutting edge
  { id: "t11-01", track: "t11", title: "eBPF: The Programmable Kernel", brief: "The in-kernel VM and verifier, BPF programs and maps, hooks (XDP/tc/tracepoints/LSM), bpftrace, CO-RE." },
  { id: "t11-02", track: "t11", title: "Rust for Linux", brief: "Why Rust in the kernel, the Rust-for-Linux project, safety vs C, the abstractions layer, the debates." },
  { id: "t11-03", track: "t11", title: "io_uring: Modern Async I/O", brief: "The problem with old async I/O, submission/completion rings, shared memory with the kernel, zero-syscall I/O." },
  { id: "t11-04", track: "t11", title: "Kernel Security: KASLR, SMEP/SMAP, Spectre/Meltdown", brief: "Exploit mitigations, classic kernel exploit classes, speculative-execution attacks, hardening." },
  { id: "t11-05", track: "t11", title: "Virtualization & KVM", brief: "Hardware virtualization, KVM architecture, the hypervisor/guest split, virtio, QEMU+KVM, nested virt." },
  { id: "t11-06", track: "t11", title: "Containers from the Kernel's View: Namespaces & cgroups", brief: "Namespaces, cgroups v2, how containers are just kernel features, building a container by hand." },
  { id: "t11-07", track: "t11", title: "Real-Time Linux (PREEMPT_RT)", brief: "Real-time requirements, latency vs throughput, the PREEMPT_RT patchset, preemption models, priority inversion." },
  { id: "t11-08", track: "t11", title: "Scheduler Extensibility: sched_ext & BPF Schedulers", brief: "sched_ext, writing schedulers in BPF, safety via the verifier, use cases, the future of scheduling." },

  // ==== Part II: The CS Core ====
  // cs0 — Discrete Math
  { id: "cs0-01", track: "cs0", title: "Logic & Propositions", brief: "Propositional logic, connectives, truth tables, logical equivalence, predicate logic, quantifiers, why logic is the bedrock of CS." },
  { id: "cs0-02", track: "cs0", title: "Proofs & Proof Techniques", brief: "Direct proof, proof by contradiction, contrapositive, proof by cases, what makes a rigorous argument, common proof mistakes." },
  { id: "cs0-03", track: "cs0", title: "Mathematical Induction & Recursion", brief: "Weak and strong induction, structural induction, recursive definitions, the well-ordering principle, proving program correctness." },
  { id: "cs0-04", track: "cs0", title: "Sets, Relations & Functions", brief: "Set operations, power sets, relations, equivalence relations, partial orders, functions, injections/surjections/bijections, cardinality." },
  { id: "cs0-05", track: "cs0", title: "Combinatorics & Counting", brief: "The sum and product rules, permutations, combinations, the binomial theorem, pigeonhole principle, inclusion-exclusion." },
  { id: "cs0-06", track: "cs0", title: "Discrete Probability", brief: "Sample spaces, events, conditional probability, Bayes theorem, random variables, expectation, variance, the union bound." },
  { id: "cs0-07", track: "cs0", title: "Graph Theory", brief: "Graphs, paths, cycles, trees, connectivity, bipartite graphs, planarity, coloring, Euler and Hamilton paths." },
  { id: "cs0-08", track: "cs0", title: "Number Theory for CS", brief: "Divisibility, modular arithmetic, GCD and the Euclidean algorithm, primes, Fermat/Euler theorems, applications to cryptography and hashing." },

  // cs1 — Continuous Math
  { id: "cs1-01", track: "cs1", title: "Calculus Essentials", brief: "Limits, continuity, derivatives, the chain rule, integrals, the fundamental theorem of calculus, why CS needs calculus." },
  { id: "cs1-02", track: "cs1", title: "Multivariable Calculus & Gradients", brief: "Partial derivatives, the gradient, the Jacobian and Hessian, directional derivatives, gradients as the engine of optimization." },
  { id: "cs1-03", track: "cs1", title: "Linear Algebra I: Vectors & Matrices", brief: "Vectors, vector spaces, matrices, matrix multiplication, linear transformations, systems of linear equations, Gaussian elimination." },
  { id: "cs1-04", track: "cs1", title: "Linear Algebra II: Eigenvalues & SVD", brief: "Determinants, eigenvalues and eigenvectors, diagonalization, the spectral theorem, singular value decomposition, applications." },
  { id: "cs1-05", track: "cs1", title: "Probability Theory", brief: "Random variables, common distributions (Bernoulli, binomial, Gaussian, Poisson), joint and marginal distributions, expectation and the law of large numbers." },
  { id: "cs1-06", track: "cs1", title: "Statistics & Inference", brief: "Estimation, maximum likelihood, Bayesian inference, confidence intervals, hypothesis testing, the central limit theorem." },
  { id: "cs1-07", track: "cs1", title: "Optimization & Gradient Descent", brief: "Convexity, gradient descent and its variants, stochastic gradient descent, constrained optimization, Lagrange multipliers." },
  { id: "cs1-08", track: "cs1", title: "Information Theory", brief: "Entropy, mutual information, the source coding theorem, Huffman coding, channel capacity, KL divergence and cross-entropy." },

  // cs2 — Programming Abstractions
  { id: "cs2-01", track: "cs2", title: "Abstraction & Computational Thinking", brief: "Abstraction barriers, decomposition, the substitution model of evaluation, building languages of increasing power (SICP philosophy)." },
  { id: "cs2-02", track: "cs2", title: "Recursion & Recursive Data", brief: "Recursive procedures vs recursive processes, tree recursion, recursive data structures, recursion vs iteration, tail calls." },
  { id: "cs2-03", track: "cs2", title: "Higher-Order Functions & Functional Programming", brief: "Functions as first-class values, map/filter/reduce, closures, currying, immutability, pure functions and referential transparency." },
  { id: "cs2-04", track: "cs2", title: "Data Abstraction & Abstract Data Types", brief: "Separating interface from implementation, ADTs, representation invariants, abstraction functions, the power of contracts." },
  { id: "cs2-05", track: "cs2", title: "Object-Oriented Programming", brief: "Objects, classes, encapsulation, inheritance, polymorphism, dynamic dispatch, composition over inheritance, message passing." },
  { id: "cs2-06", track: "cs2", title: "Generic Programming & Polymorphism", brief: "Parametric polymorphism, generics/templates, bounded types, type erasure vs monomorphization, ad-hoc polymorphism and overloading." },
  { id: "cs2-07", track: "cs2", title: "Modularity, State & Environments", brief: "The environment model of evaluation, mutable state and its costs, scope and closures, modules and namespaces, managing complexity." },
  { id: "cs2-08", track: "cs2", title: "Building an Interpreter", brief: "The read-eval-print loop, the metacircular evaluator, eval and apply, how a language interprets itself (SICP chapter 4)." },

  // cs3 — Data Structures
  { id: "cs3-01", track: "cs3", title: "Arrays, Lists, Stacks & Queues", brief: "Contiguous vs linked storage, dynamic arrays and amortized cost, singly/doubly linked lists, stacks, queues, deques." },
  { id: "cs3-02", track: "cs3", title: "Hash Tables", brief: "Hash functions, collision resolution (chaining, open addressing), load factor, resizing, why average-case O(1), hashing in practice." },
  { id: "cs3-03", track: "cs3", title: "Trees & Binary Search Trees", brief: "Tree terminology, traversals, binary search trees, insertion/deletion/search, why balance matters, BST degradation." },
  { id: "cs3-04", track: "cs3", title: "Balanced Trees: AVL, Red-Black & B-Trees", brief: "Self-balancing trees, rotations, AVL and red-black invariants, B-trees and B+ trees for disk, why databases use them." },
  { id: "cs3-05", track: "cs3", title: "Heaps & Priority Queues", brief: "The binary heap, heapify, insert/extract-min, the heap property, heapsort, applications (scheduling, Dijkstra), d-ary and Fibonacci heaps." },
  { id: "cs3-06", track: "cs3", title: "Graphs: Representations", brief: "Adjacency matrix vs adjacency list, directed/undirected/weighted graphs, space-time tradeoffs, when to use which." },
  { id: "cs3-07", track: "cs3", title: "Tries & String Data Structures", brief: "Prefix trees, suffix trees and arrays, applications in autocomplete and search, radix trees, space-efficient string storage." },
  { id: "cs3-08", track: "cs3", title: "Union-Find & Advanced Structures", brief: "Disjoint-set/union-find with path compression and union by rank, segment trees, Fenwick (binary indexed) trees, skip lists." },

  // cs4 — Algorithms
  { id: "cs4-01", track: "cs4", title: "Algorithm Analysis & Asymptotics", brief: "Big-O, big-Omega, big-Theta, worst/average/best case, amortized analysis, the RAM model, why we count operations." },
  { id: "cs4-02", track: "cs4", title: "Sorting Algorithms", brief: "Insertion/selection/bubble, merge sort, quicksort, heapsort, the O(n log n) lower bound, counting/radix/bucket sort, stability." },
  { id: "cs4-03", track: "cs4", title: "Divide & Conquer", brief: "The divide-and-conquer paradigm, the master theorem, recurrence solving, examples (merge sort, Karatsuba, Strassen, closest pair)." },
  { id: "cs4-04", track: "cs4", title: "Greedy Algorithms", brief: "The greedy choice property, exchange arguments, examples (activity selection, Huffman, Kruskal/Prim), when greedy fails." },
  { id: "cs4-05", track: "cs4", title: "Dynamic Programming", brief: "Optimal substructure and overlapping subproblems, memoization vs tabulation, classic DPs (knapsack, LCS, edit distance, coin change)." },
  { id: "cs4-06", track: "cs4", title: "Graph Traversal: BFS, DFS & Applications", brief: "Breadth-first and depth-first search, the BFS/DFS tree, topological sort, connected components, strongly connected components, cycle detection." },
  { id: "cs4-07", track: "cs4", title: "Shortest Paths", brief: "Single-source shortest paths, Dijkstra, Bellman-Ford, negative edges, Floyd-Warshall all-pairs, A* and heuristics." },
  { id: "cs4-08", track: "cs4", title: "Minimum Spanning Trees", brief: "The MST problem, the cut property, Kruskal and Prim, union-find in Kruskal, applications in clustering and network design." },
  { id: "cs4-09", track: "cs4", title: "Network Flow", brief: "Flow networks, max-flow min-cut theorem, Ford-Fulkerson and Edmonds-Karp, bipartite matching, applications." },
  { id: "cs4-10", track: "cs4", title: "NP-Completeness & Reductions", brief: "P vs NP, polynomial-time reductions, NP-hard and NP-complete, SAT, Cook-Levin, proving problems hard, coping with intractability." },
  { id: "cs4-11", track: "cs4", title: "Randomized & Approximation Algorithms", brief: "Las Vegas vs Monte Carlo, randomized quicksort, hashing, approximation ratios, vertex cover and TSP approximations." },
  { id: "cs4-12", track: "cs4", title: "String Algorithms", brief: "Pattern matching, naive vs KMP, Rabin-Karp fingerprinting, Boyer-Moore, suffix arrays, applications in bioinformatics and search." },

  // cs5 — Theory of Computation
  { id: "cs5-01", track: "cs5", title: "Finite Automata & Regular Languages", brief: "Deterministic and nondeterministic finite automata, regular languages, the subset construction, closure properties." },
  { id: "cs5-02", track: "cs5", title: "Regular Expressions & the Pumping Lemma", brief: "Regular expressions, equivalence with finite automata, the pumping lemma, proving languages non-regular, regex in practice." },
  { id: "cs5-03", track: "cs5", title: "Context-Free Grammars & Pushdown Automata", brief: "CFGs, derivations and parse trees, ambiguity, pushdown automata, the context-free pumping lemma, applications to parsing." },
  { id: "cs5-04", track: "cs5", title: "Turing Machines & the Church-Turing Thesis", brief: "The Turing machine model, configurations, variants, the Church-Turing thesis, the universal Turing machine, computability." },
  { id: "cs5-05", track: "cs5", title: "Decidability & the Halting Problem", brief: "Decidable vs recognizable languages, diagonalization, the halting problem, why some problems can never be solved by any program." },
  { id: "cs5-06", track: "cs5", title: "Reducibility & Undecidability", brief: "Mapping reductions, Rice theorem, proving undecidability via reduction, the landscape of unsolvable problems." },
  { id: "cs5-07", track: "cs5", title: "Time Complexity: P and NP", brief: "Complexity classes, P, NP, the verifier definition, polynomial-time reductions, the P vs NP question and why it matters." },
  { id: "cs5-08", track: "cs5", title: "NP-Completeness in Depth", brief: "NP-hardness, NP-completeness, the Cook-Levin theorem, the web of reductions (3-SAT, clique, vertex cover, Hamiltonian path)." },
  { id: "cs5-09", track: "cs5", title: "Space Complexity & Beyond", brief: "Space complexity classes, PSPACE, Savitch theorem, L and NL, the complexity hierarchy, a glimpse of randomized and quantum classes." },

  // cs6 — Programming Languages
  { id: "cs6-01", track: "cs6", title: "Syntax, Semantics & the Lambda Calculus", brief: "Concrete vs abstract syntax, the untyped lambda calculus, beta reduction, Church encodings, the foundation of functional languages." },
  { id: "cs6-02", track: "cs6", title: "Operational & Denotational Semantics", brief: "Small-step and big-step operational semantics, denotational semantics, why formal semantics matter, reasoning about programs." },
  { id: "cs6-03", track: "cs6", title: "Type Systems & Type Checking", brief: "What types are for, static vs dynamic typing, the simply-typed lambda calculus, type safety, progress and preservation." },
  { id: "cs6-04", track: "cs6", title: "Polymorphism & Type Inference", brief: "Parametric polymorphism, System F, Hindley-Milner type inference, unification, how ML and Haskell infer types." },
  { id: "cs6-05", track: "cs6", title: "Advanced Type Features", brief: "Algebraic data types, pattern matching, subtyping, variance, generics, dependent types and the Curry-Howard correspondence." },
  { id: "cs6-06", track: "cs6", title: "Memory Management & Garbage Collection", brief: "Manual vs automatic memory, reference counting, tracing GC (mark-sweep, copying, generational), ownership and borrowing." },
  { id: "cs6-07", track: "cs6", title: "Concurrency Models", brief: "Shared memory vs message passing, the actor model, communicating sequential processes, software transactional memory, async/await." },
  { id: "cs6-08", track: "cs6", title: "Paradigms & Metaprogramming", brief: "Imperative, functional, logic and declarative paradigms, macros and homoiconicity, reflection, DSLs, language-oriented programming." },

  // cs7 — Compilers
  { id: "cs7-01", track: "cs7", title: "The Anatomy of a Compiler", brief: "The compiler pipeline, front end vs back end, the phases (lexing, parsing, semantic analysis, IR, optimization, codegen), passes." },
  { id: "cs7-02", track: "cs7", title: "Lexical Analysis", brief: "Tokens and lexemes, regular expressions for tokens, building a scanner, NFA/DFA construction, lexer generators (lex/flex)." },
  { id: "cs7-03", track: "cs7", title: "Parsing: Top-Down", brief: "Context-free grammars for languages, recursive-descent parsing, LL(1) parsing, predictive parsing, FIRST and FOLLOW sets." },
  { id: "cs7-04", track: "cs7", title: "Parsing: Bottom-Up", brief: "Shift-reduce parsing, LR(0)/SLR/LALR/LR(1), the parsing table, yacc/bison, handling ambiguity and precedence." },
  { id: "cs7-05", track: "cs7", title: "Abstract Syntax Trees & Semantic Analysis", brief: "Building the AST, the visitor pattern, scope and symbol tables, name resolution, semantic checks beyond syntax." },
  { id: "cs7-06", track: "cs7", title: "Type Checking & Inference in Compilers", brief: "Type rules, type environments, checking expressions and statements, inference, error reporting, attribute grammars." },
  { id: "cs7-07", track: "cs7", title: "Intermediate Representations", brief: "Why use an IR, three-address code, control-flow graphs, static single assignment (SSA), LLVM IR, lowering." },
  { id: "cs7-08", track: "cs7", title: "Code Generation & Register Allocation", brief: "Instruction selection, register allocation via graph coloring, the stack and calling conventions, generating real assembly." },
  { id: "cs7-09", track: "cs7", title: "Optimization", brief: "Local vs global optimization, dataflow analysis, constant folding, dead code elimination, loop optimizations, peephole, inlining." },

  // cs8 — Databases
  { id: "cs8-01", track: "cs8", title: "The Relational Model", brief: "Relations, tuples, schemas, keys, relational algebra (select/project/join), the theory behind every SQL database." },
  { id: "cs8-02", track: "cs8", title: "SQL in Depth", brief: "DDL and DML, joins, aggregation and GROUP BY, subqueries, window functions, CTEs, views, the declarative mindset." },
  { id: "cs8-03", track: "cs8", title: "Database Design & Normalization", brief: "Entity-relationship modeling, functional dependencies, normal forms (1NF-BCNF), denormalization tradeoffs, schema design." },
  { id: "cs8-04", track: "cs8", title: "Storage & Indexing", brief: "Pages and the buffer pool, row vs column stores, B+ tree indexes, hash indexes, clustered vs secondary indexes, when to index." },
  { id: "cs8-05", track: "cs8", title: "Query Processing & Optimization", brief: "Query plans, the iterator model, join algorithms (nested loop, hash, sort-merge), cost-based optimization, statistics." },
  { id: "cs8-06", track: "cs8", title: "Transactions & ACID", brief: "The transaction concept, atomicity, consistency, isolation, durability, anomalies, why transactions exist." },
  { id: "cs8-07", track: "cs8", title: "Concurrency Control", brief: "Serializability, two-phase locking, deadlocks, optimistic concurrency, multiversion concurrency control (MVCC), isolation levels." },
  { id: "cs8-08", track: "cs8", title: "Recovery & Durability", brief: "Crash recovery, write-ahead logging, the ARIES algorithm, checkpoints, undo/redo, ensuring durability against failure." },
  { id: "cs8-09", track: "cs8", title: "Distributed & NoSQL Databases", brief: "Sharding and partitioning, replication, the CAP theorem, key-value/document/column/graph stores, NewSQL, when to leave SQL." },

  // cs9 — Networks
  { id: "cs9-01", track: "cs9", title: "The Internet & Layered Architecture", brief: "Packet switching vs circuit switching, the OSI and TCP/IP layer models, encapsulation, end-to-end principle, the hourglass." },
  { id: "cs9-02", track: "cs9", title: "The Link Layer & Ethernet", brief: "Framing, MAC addresses, Ethernet, switching, ARP, collision detection, the local network." },
  { id: "cs9-03", track: "cs9", title: "The Network Layer & IP Routing", brief: "IP addressing, subnets and CIDR, IPv4 vs IPv6, forwarding vs routing, routing algorithms (link-state, distance-vector), BGP." },
  { id: "cs9-04", track: "cs9", title: "The Transport Layer: TCP & UDP", brief: "Ports and multiplexing, UDP, TCP, the three-way handshake, reliable delivery, sequence numbers, flow control, sockets." },
  { id: "cs9-05", track: "cs9", title: "Congestion Control", brief: "Network congestion, TCP congestion control (slow start, AIMD, congestion avoidance), fairness, modern algorithms (CUBIC, BBR)." },
  { id: "cs9-06", track: "cs9", title: "The Application Layer: DNS & HTTP", brief: "The client-server model, DNS resolution, HTTP/1.1, HTTP/2 and HTTP/3, REST, the web as an application of networking." },
  { id: "cs9-07", track: "cs9", title: "Network Security: TLS & Beyond", brief: "Threats on the wire, TLS handshake and certificates, the PKI, VPNs, firewalls, DDoS, secure protocols." },
  { id: "cs9-08", track: "cs9", title: "Modern Networking", brief: "Wireless and cellular, CDNs and edge, software-defined networking, network function virtualization, data-center networks." },

  // cs10 — Distributed Systems
  { id: "cs10-01", track: "cs10", title: "Why Distributed Systems Are Hard", brief: "The eight fallacies, partial failure, asynchrony, the lack of a global clock, what makes distributed reasoning fundamentally different." },
  { id: "cs10-02", track: "cs10", title: "Communication & RPC", brief: "Remote procedure calls, marshalling/serialization, at-most-once vs at-least-once semantics, gRPC, message queues." },
  { id: "cs10-03", track: "cs10", title: "Time, Clocks & Ordering", brief: "Physical clocks and skew, logical clocks, Lamport timestamps, vector clocks, happens-before, total vs partial order." },
  { id: "cs10-04", track: "cs10", title: "Replication & Consistency Models", brief: "Why replicate, primary-backup, quorum systems, strong vs eventual consistency, linearizability, sequential consistency." },
  { id: "cs10-05", track: "cs10", title: "Consensus: Paxos & Raft", brief: "The consensus problem, FLP impossibility, Paxos, Raft (leader election, log replication), state machine replication." },
  { id: "cs10-06", track: "cs10", title: "Distributed Transactions", brief: "Atomic commit across nodes, two-phase commit, three-phase commit, sagas, the tension with availability." },
  { id: "cs10-07", track: "cs10", title: "The CAP Theorem & Tradeoffs", brief: "Consistency, availability, partition tolerance, the CAP theorem, PACELC, choosing the right tradeoff for an application." },
  { id: "cs10-08", track: "cs10", title: "MapReduce & Large-Scale Data", brief: "The MapReduce model, Hadoop and Spark, distributed file systems (GFS/HDFS), batch vs stream processing, data parallelism." },
  { id: "cs10-09", track: "cs10", title: "Fault Tolerance & Reliability", brief: "Failure models, redundancy, checkpointing, leader election, gossip protocols, designing systems that survive failure." },

  // cs11 — AI
  { id: "cs11-01", track: "cs11", title: "Intelligent Agents & Problem Formulation", brief: "What is AI, rational agents, the agent-environment loop, formulating problems as state spaces, performance measures." },
  { id: "cs11-02", track: "cs11", title: "Uninformed & Informed Search", brief: "BFS/DFS/UCS for problem solving, heuristics, greedy best-first, A* search, admissibility and consistency, optimality." },
  { id: "cs11-03", track: "cs11", title: "Adversarial Search & Games", brief: "Game trees, minimax, alpha-beta pruning, evaluation functions, expectimax, Monte Carlo tree search, how game AIs think." },
  { id: "cs11-04", track: "cs11", title: "Constraint Satisfaction Problems", brief: "Variables, domains, constraints, backtracking search, constraint propagation, arc consistency, heuristics for CSPs." },
  { id: "cs11-05", track: "cs11", title: "Logic & Knowledge Representation", brief: "Propositional and first-order logic for AI, inference, resolution, knowledge bases, the symbolic AI tradition." },
  { id: "cs11-06", track: "cs11", title: "Planning", brief: "Classical planning, STRIPS, state-space and plan-space search, heuristics for planning, planning under uncertainty." },
  { id: "cs11-07", track: "cs11", title: "Probabilistic Reasoning & Bayesian Networks", brief: "Reasoning under uncertainty, Bayesian networks, conditional independence, inference, hidden Markov models." },
  { id: "cs11-08", track: "cs11", title: "Markov Decision Processes", brief: "Sequential decision making, MDPs, the Bellman equation, value and policy iteration, the bridge to reinforcement learning." },

  // cs12 — Machine Learning
  { id: "cs12-01", track: "cs12", title: "Foundations of Machine Learning", brief: "Supervised vs unsupervised vs reinforcement learning, features and labels, training vs test, generalization, the ML workflow." },
  { id: "cs12-02", track: "cs12", title: "Linear & Logistic Regression", brief: "Linear regression and least squares, the normal equations, logistic regression for classification, the sigmoid, loss functions." },
  { id: "cs12-03", track: "cs12", title: "Bias-Variance & Regularization", brief: "Underfitting and overfitting, the bias-variance tradeoff, L1/L2 regularization, ridge and lasso, model selection." },
  { id: "cs12-04", track: "cs12", title: "Support Vector Machines & Kernels", brief: "Maximum-margin classifiers, the kernel trick, soft margins, RBF kernels, the duality view, when to use SVMs." },
  { id: "cs12-05", track: "cs12", title: "Decision Trees & Ensembles", brief: "Decision trees, entropy and information gain, overfitting, bagging, random forests, boosting and gradient boosting (XGBoost)." },
  { id: "cs12-06", track: "cs12", title: "Unsupervised Learning", brief: "K-means clustering, hierarchical clustering, Gaussian mixture models and EM, dimensionality reduction with PCA, t-SNE." },
  { id: "cs12-07", track: "cs12", title: "Neural Networks & Backpropagation", brief: "The perceptron, multilayer networks, activation functions, forward propagation, backpropagation and the chain rule, training." },
  { id: "cs12-08", track: "cs12", title: "Evaluation & ML in Practice", brief: "Train/validation/test splits, cross-validation, precision/recall/F1, ROC-AUC, confusion matrices, data leakage, the practical pitfalls." },

  // cs13 — Deep Learning
  { id: "cs13-01", track: "cs13", title: "Deep Networks & Optimization", brief: "Why depth, vanishing/exploding gradients, initialization, batch normalization, optimizers (SGD, momentum, Adam), dropout." },
  { id: "cs13-02", track: "cs13", title: "Convolutional Neural Networks", brief: "Convolution and pooling, feature maps, the architecture of CNNs (LeNet to ResNet), why CNNs work for images." },
  { id: "cs13-03", track: "cs13", title: "Sequence Models & RNNs", brief: "Modeling sequences, recurrent neural networks, backprop through time, the vanishing gradient, LSTMs and GRUs." },
  { id: "cs13-04", track: "cs13", title: "Attention & Transformers", brief: "The attention mechanism, self-attention, the Transformer architecture, multi-head attention, positional encoding, why it changed everything." },
  { id: "cs13-05", track: "cs13", title: "Large Language Models", brief: "Pretraining and tokenization, the GPT family, scaling laws, fine-tuning and RLHF, in-context learning, how modern LLMs work." },
  { id: "cs13-06", track: "cs13", title: "Generative Models", brief: "Autoencoders and VAEs, generative adversarial networks (GANs), diffusion models, how machines create images and audio." },
  { id: "cs13-07", track: "cs13", title: "Reinforcement Learning", brief: "Agents, rewards and policies, Q-learning, policy gradients, deep RL (DQN, actor-critic), AlphaGo, exploration vs exploitation." },
  { id: "cs13-08", track: "cs13", title: "Embeddings & Representation Learning", brief: "Word2vec and embeddings, contrastive learning, transfer learning, self-supervised learning, foundation models." },

  // cs14 — Security & Crypto
  { id: "cs14-01", track: "cs14", title: "Security Principles & Threat Modeling", brief: "The CIA triad, threat models, attack surfaces, the principle of least privilege, defense in depth, thinking like an attacker." },
  { id: "cs14-02", track: "cs14", title: "Symmetric Cryptography", brief: "Confusion and diffusion, block ciphers, AES, modes of operation, stream ciphers, the one-time pad, perfect secrecy." },
  { id: "cs14-03", track: "cs14", title: "Public-Key Cryptography", brief: "The key distribution problem, RSA, Diffie-Hellman key exchange, elliptic-curve cryptography, the math of trapdoor functions." },
  { id: "cs14-04", track: "cs14", title: "Hashing, MACs & Digital Signatures", brief: "Cryptographic hash functions, SHA-2/3, collision resistance, message authentication codes, digital signatures, certificates." },
  { id: "cs14-05", track: "cs14", title: "Software Security & Exploitation", brief: "Buffer overflows, stack smashing, return-oriented programming, integer overflows, mitigations (ASLR, DEP, canaries, CFI)." },
  { id: "cs14-06", track: "cs14", title: "Web Security", brief: "The web threat model, SQL injection, XSS, CSRF, the same-origin policy, authentication, session management, secure cookies." },
  { id: "cs14-07", track: "cs14", title: "Network & Systems Security", brief: "TLS in depth, the PKI and trust, firewalls and IDS, malware, access control models, sandboxing, secure system design." },
  { id: "cs14-08", track: "cs14", title: "Privacy & Modern Cryptography", brief: "Anonymity (Tor), differential privacy, zero-knowledge proofs, homomorphic encryption, secure multiparty computation, blockchains." },

  // cs15 — Graphics & Vision
  { id: "cs15-01", track: "cs15", title: "The Graphics Pipeline & Rasterization", brief: "From 3D scene to 2D image, the rendering pipeline, vertices to fragments, rasterization, the GPU, z-buffering." },
  { id: "cs15-02", track: "cs15", title: "Transformations & Homogeneous Coordinates", brief: "Modeling/view/projection transforms, homogeneous coordinates, matrix composition, perspective vs orthographic, the camera model." },
  { id: "cs15-03", track: "cs15", title: "Lighting, Shading & Materials", brief: "The physics of light, the Phong reflection model, diffuse/specular/ambient, shading models (flat/Gouraud/Phong), textures and normal maps." },
  { id: "cs15-04", track: "cs15", title: "Ray Tracing & Global Illumination", brief: "Ray casting and ray tracing, ray-object intersection, reflection and refraction, shadows, path tracing, the rendering equation." },
  { id: "cs15-05", track: "cs15", title: "Geometry: Curves, Surfaces & Meshes", brief: "Polygon meshes, Bezier curves and B-splines, subdivision surfaces, parametric vs implicit surfaces, geometry processing." },
  { id: "cs15-06", track: "cs15", title: "Image Processing Fundamentals", brief: "Digital images, convolution and filtering, edge detection, blurring and sharpening, the frequency domain and the Fourier transform." },
  { id: "cs15-07", track: "cs15", title: "Computer Vision", brief: "Feature detection (edges, corners, SIFT), image segmentation, object detection and recognition, the move from features to deep learning." },
  { id: "cs15-08", track: "cs15", title: "Animation & Physical Simulation", brief: "Keyframing and interpolation, skeletal animation, particle systems, physics simulation, collision detection, procedural generation." },

  // cs16 — Software Engineering
  { id: "cs16-01", track: "cs16", title: "Software Design Principles", brief: "Managing complexity, coupling and cohesion, SOLID principles, separation of concerns, designing for change, modularity." },
  { id: "cs16-02", track: "cs16", title: "Specifications, Abstraction & Invariants", brief: "Writing specifications, preconditions and postconditions, representation invariants, abstraction functions, design by contract." },
  { id: "cs16-03", track: "cs16", title: "Testing & Test-Driven Development", brief: "Unit/integration/system testing, test coverage, TDD, mocking, property-based testing, the testing pyramid, why tests matter." },
  { id: "cs16-04", track: "cs16", title: "Design Patterns", brief: "The Gang of Four patterns, creational/structural/behavioral, when to use patterns, anti-patterns, refactoring toward patterns." },
  { id: "cs16-05", track: "cs16", title: "Version Control & Collaboration", brief: "Git workflows, branching strategies, code review, continuous integration, pull requests, working on a team, technical debt." },
  { id: "cs16-06", track: "cs16", title: "Concurrency & Parallelism in Software", brief: "Threads and processes, race conditions and deadlocks, locks and atomics, thread pools, async programming, parallel patterns." },
  { id: "cs16-07", track: "cs16", title: "System Design & Scalability", brief: "Designing large systems, load balancing, caching, sharding, the CAP-aware architecture, microservices, the system design interview." },
  { id: "cs16-08", track: "cs16", title: "Software Architecture & APIs", brief: "Architectural styles (layered, event-driven, microservices), API design, REST vs RPC vs GraphQL, documentation, maintainability." },

  // cs17 — HCI & Ethics
  { id: "cs17-01", track: "cs17", title: "Human-Computer Interaction", brief: "The psychology of users, usability heuristics, the design process, prototyping, affordances, user-centered design." },
  { id: "cs17-02", track: "cs17", title: "Interface & Interaction Design", brief: "Visual design principles, information architecture, interaction patterns, feedback and responsiveness, design systems." },
  { id: "cs17-03", track: "cs17", title: "Accessibility & Inclusive Design", brief: "Designing for disabilities, screen readers, WCAG, universal design, why accessibility is engineering, not charity." },
  { id: "cs17-04", track: "cs17", title: "Computer Ethics & Society", brief: "The social responsibility of computing, intellectual property, free software, the digital divide, professional ethics codes." },
  { id: "cs17-05", track: "cs17", title: "AI Ethics, Privacy & Data", brief: "Algorithmic bias and fairness, surveillance and privacy, data ethics, the societal impact of AI, accountability and transparency." },
  { id: "cs17-06", track: "cs17", title: "The Practice of Computing as a Career", brief: "How research happens, reading papers, open source, lifelong learning, the breadth of CS careers, where to go next." },
];

// ---- derived helpers (metadata only — safe in client & server) ----

export function trackById(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}

export function modulesInTrack(trackId: string): ModuleMeta[] {
  return MODULES.filter((m) => m.track === trackId);
}

export function moduleById(id: string): ModuleMeta | undefined {
  return MODULES.find((m) => m.id === id);
}

/** Global linear order of all modules (track order, then module order). */
export const ORDERED_MODULE_IDS: string[] = MODULES.map((m) => m.id);

export function moduleIndex(id: string): number {
  return ORDERED_MODULE_IDS.indexOf(id);
}

export function prevModule(id: string): ModuleMeta | undefined {
  const i = moduleIndex(id);
  return i > 0 ? MODULES[i - 1] : undefined;
}

export function nextModule(id: string): ModuleMeta | undefined {
  const i = moduleIndex(id);
  return i >= 0 && i < MODULES.length - 1 ? MODULES[i + 1] : undefined;
}

export const TOTAL_MODULES = MODULES.length;
export const TOTAL_TRACKS = TRACKS.length;
