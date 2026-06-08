// ------------------------------------------------------------------ //
//  KernelPath — canonical curriculum STRUCTURE (metadata only).
//  This is the single source of truth for tracks, modules & ordering.
//  Rich per-module teaching content lives in content/content.json and
//  is merged in lib/content.ts (server-only).
// ------------------------------------------------------------------ //

export interface Track {
  id: string;
  title: string;
  blurb: string;
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
