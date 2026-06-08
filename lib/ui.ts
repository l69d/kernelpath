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
  // Part II — CS Core
  cs0: "#58a6ff",
  cs1: "#bc8cff",
  cs2: "#3fb950",
  cs3: "#39c5e0",
  cs4: "#e3a93c",
  cs5: "#f778ba",
  cs6: "#58a6ff",
  cs7: "#bc8cff",
  cs8: "#3fb950",
  cs9: "#39c5e0",
  cs10: "#e3a93c",
  cs11: "#f778ba",
  cs12: "#58a6ff",
  cs13: "#bc8cff",
  cs14: "#3fb950",
  cs15: "#39c5e0",
  cs16: "#e3a93c",
  cs17: "#f778ba",
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
  // Part II — CS Core (continuous numbering 12–29)
  cs0: "12",
  cs1: "13",
  cs2: "14",
  cs3: "15",
  cs4: "16",
  cs5: "17",
  cs6: "18",
  cs7: "19",
  cs8: "20",
  cs9: "21",
  cs10: "22",
  cs11: "23",
  cs12: "24",
  cs13: "25",
  cs14: "26",
  cs15: "27",
  cs16: "28",
  cs17: "29",
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
