// Presentational helpers — plain module, safe in client or server.

export const TRACK_COLOR: Record<string, string> = {
  t0: "#56d364",
  t1: "#3fb950",
  t2: "#39c5e0",
  t3: "#58a6ff",
  t4: "#bc8cff",
  t5: "#f778ba",
  t6: "#e3a93c",
  t7: "#56d364",
  t8: "#39c5e0",
  t9: "#bc8cff",
  t10: "#f778ba",
  t11: "#e3a93c",
};

export const TRACK_INDEX: Record<string, string> = {
  t0: "00",
  t1: "01",
  t2: "02",
  t3: "03",
  t4: "04",
  t5: "05",
  t6: "06",
  t7: "07",
  t8: "08",
  t9: "09",
  t10: "10",
  t11: "11",
};

export function trackColor(trackId: string): string {
  return TRACK_COLOR[trackId] ?? "#3fb950";
}

export const RESOURCE_ICON: Record<string, string> = {
  book: "📕",
  video: "▶",
  course: "🎓",
  article: "✎",
  docs: "📄",
  tool: "🔧",
  paper: "📜",
  interactive: "⚡",
};

export const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "#3fb950",
  medium: "#e3a93c",
  hard: "#f85149",
};
