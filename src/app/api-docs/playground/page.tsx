import React from "react";
import Link from "next/link";
import { BookOpen, Play, Code2, ExternalLink } from "lucide-react";
import type { OpenApiSpec } from "@/lib/openapi-types";
import { PlaygroundClient } from "@/components/api-docs/PlaygroundClient";

async function loadSpec(): Promise<OpenApiSpec> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ??
    "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/openapi`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) return (await res.json()) as OpenApiSpec;
  } catch {
    // fall through
  }

  return {
    openapi: "3.1.0",
    info: { title: "Stellar Insights API", version: "1.0.0" },
    servers: [
      { url: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080" },
    ],
    paths: {},
  };
}

export const metadata = {
  title: "API Playground — Stellar Insights",
  description:
    "Interactively send live requests to the Stellar Insights API from your browser.",
};

export default async function PlaygroundPage() {
  const spec = await loadSpec();

  // Playground fires requests directly to the backend from the browser.
  // NEXT_PUBLIC_API_URL is embedded at build time and available client-side.
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ??
    "http://localhost:8080";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-2 mb-1">
            <Play size={20} className="text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              API Playground
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white">Try It Out</h1>
          <p className="mt-1 text-gray-400 max-w-2xl">
            Send live requests to the Stellar Insights backend directly from
            your browser. Select any endpoint, fill in the parameters, and hit
            Send.
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>
              Targeting:{" "}
              <code className="font-mono text-gray-300">{backendUrl}</code>
            </span>
          </div>

          <nav
            className="mt-5 flex items-center gap-2 flex-wrap"
            aria-label="API docs navigation"
          >
            <Link
              href="/api-docs"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition-colors"
            >
              <BookOpen size={14} />
              Reference
            </Link>
            <Link
              href="/api-docs/playground"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium"
            >
              <Play size={14} />
              Playground
            </Link>
            <Link
              href="/api-docs/examples"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition-colors"
            >
              <Code2 size={14} />
              Code Examples
            </Link>
            <a
              href="/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition-colors ml-auto"
            >
              <ExternalLink size={14} />
              openapi.json
            </a>
          </nav>
        </div>
      </header>

      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 py-8"
        id="main-content"
      >
        <PlaygroundClient spec={spec} baseUrl={backendUrl} />
      </main>
    </div>
  );
}
