import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "highlight.js/styles/github-dark.css";
import { ProgressProvider } from "@/components/ProgressProvider";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://kernelpath.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "KernelPath — From First Principles to the Linux Kernel",
    template: "%s · KernelPath",
  },
  description:
    "An exhaustive, visual, free roadmap that takes you from bits and logic gates all the way to contributing to the Linux kernel. 112 modules across 12 tracks, with diagrams, code, resources and progress tracking.",
  keywords: [
    "Linux kernel",
    "kernel development",
    "operating systems",
    "computer architecture",
    "C programming",
    "device drivers",
    "eBPF",
    "Rust for Linux",
    "roadmap",
    "systems programming",
  ],
  authors: [{ name: "KernelPath" }],
  openGraph: {
    title: "KernelPath — From First Principles to the Linux Kernel",
    description:
      "An exhaustive, visual roadmap from transistors to kernel contribution. 112 modules, 12 tracks, diagrams, code & progress tracking.",
    url: SITE_URL,
    siteName: "KernelPath",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KernelPath — From First Principles to the Linux Kernel",
    description:
      "An exhaustive, visual roadmap from transistors to kernel contribution.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ProgressProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </ProgressProvider>
      </body>
    </html>
  );
}
