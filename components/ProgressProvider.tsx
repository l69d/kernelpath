"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MODULES, TOTAL_MODULES } from "@/lib/modules";

// NOTE: React 19 exposes useCallback normally; alias to avoid a lint quirk.
const useCb = useCallback as typeof useCallback;

const STORAGE_KEY = "kernelpath.progress.v1";

interface PersistShape {
  version: number;
  completed: string[];
  startedAt: number | null;
}

interface ProgressCtx {
  hydrated: boolean;
  completed: Set<string>;
  isDone: (id: string) => boolean;
  toggle: (id: string) => void;
  setDone: (id: string, done: boolean) => void;
  reset: () => void;
  importJson: (json: string) => boolean;
  exportJson: () => string;
  doneCount: number;
  total: number;
  fraction: number;
  trackFraction: (trackId: string) => number;
  trackDone: (trackId: string) => number;
  startedAt: number | null;
}

const Ctx = createContext<ProgressCtx | null>(null);

function load(): PersistShape {
  if (typeof window === "undefined") {
    return { version: 1, completed: [], startedAt: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, completed: [], startedAt: null };
    const parsed = JSON.parse(raw) as PersistShape;
    if (!Array.isArray(parsed.completed)) {
      return { version: 1, completed: [], startedAt: null };
    }
    return {
      version: 1,
      completed: parsed.completed.filter((x) => typeof x === "string"),
      startedAt: parsed.startedAt ?? null,
    };
  } catch {
    return { version: 1, completed: [], startedAt: null };
  }
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [startedAt, setStartedAt] = useState<number | null>(null);

  // hydrate once on mount
  useEffect(() => {
    const data = load();
    setCompleted(new Set(data.completed));
    setStartedAt(data.startedAt);
    setHydrated(true);
  }, []);

  // persist on change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    const payload: PersistShape = {
      version: 1,
      completed: Array.from(completed),
      startedAt: startedAt,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota / disabled storage */
    }
  }, [completed, startedAt, hydrated]);

  const setDone = useCb((id: string, done: boolean) => {
    setStartedAt((prev) => prev ?? Date.now());
    setCompleted((prev) => {
      const next = new Set(prev);
      if (done) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggle = useCb(
    (id: string) => {
      setStartedAt((prev) => prev ?? Date.now());
      setCompleted((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [],
  );

  const reset = useCb(() => {
    setCompleted(new Set());
    setStartedAt(null);
  }, []);

  const importJson = useCb((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as PersistShape;
      if (!Array.isArray(parsed.completed)) return false;
      const valid = parsed.completed.filter(
        (x) => typeof x === "string" && MODULES.some((m) => m.id === x),
      );
      setCompleted(new Set(valid));
      setStartedAt(parsed.startedAt ?? Date.now());
      return true;
    } catch {
      return false;
    }
  }, []);

  const exportJson = useCb((): string => {
    const payload: PersistShape = {
      version: 1,
      completed: Array.from(completed),
      startedAt,
    };
    return JSON.stringify(payload, null, 2);
  }, [completed, startedAt]);

  const value = useMemo<ProgressCtx>(() => {
    const isDone = (id: string) => completed.has(id);
    const trackDone = (trackId: string) =>
      MODULES.filter((m) => m.track === trackId && completed.has(m.id)).length;
    const trackFraction = (trackId: string) => {
      const inTrack = MODULES.filter((m) => m.track === trackId).length;
      return inTrack === 0 ? 0 : trackDone(trackId) / inTrack;
    };
    return {
      hydrated,
      completed,
      isDone,
      toggle,
      setDone,
      reset,
      importJson,
      exportJson,
      doneCount: completed.size,
      total: TOTAL_MODULES,
      fraction: TOTAL_MODULES === 0 ? 0 : completed.size / TOTAL_MODULES,
      trackFraction,
      trackDone,
      startedAt,
    };
  }, [completed, hydrated, startedAt, toggle, setDone, reset, importJson, exportJson]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useProgress must be used within <ProgressProvider>");
  }
  return ctx;
}
