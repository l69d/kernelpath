import type { MetadataRoute } from "next";
import { MODULES, TRACKS } from "@/lib/modules";

const BASE = "https://kernelpath.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/about", "/progress", "/sandbox"].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.6,
  }));
  const trackRoutes = TRACKS.map((t) => ({
    url: `${BASE}/track/${t.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const moduleRoutes = MODULES.map((m) => ({
    url: `${BASE}/module/${m.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  return [...staticRoutes, ...trackRoutes, ...moduleRoutes];
}
