import React from "react";
import Link from "next/link";
import { BookOpen, Play, Code2, ExternalLink } from "lucide-react";
import type { OpenApiSpec } from "@/lib/openapi-types";
import { ExamplesClient } from "@/components/api-docs/ExamplesClient";

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
  title: "Code Examples — Stellar Insights API",
  description:
    "Ready-to-use cURL, JavaScript, and Python snippets for every Stellar Insights API endpoint.",
};

export default async function ExamplesPage() {
  const spec = await loadSpec();

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ??
    "http://localhost:8080";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-2 mb-1">
            <Code2 size={20} className="text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Code Examples
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white">Code Examples</h1>
          <p className="mt-1 text-gray-400 max-w-2xl">
            Copy-paste ready snippets for every API endpoint in cURL,
            JavaScript (fetch), and Python (requests). All examples target{" "}
            <code className="font-mono text-indigo-300 text-sm">
              {backendUrl}
            </code>
            .
          </p>

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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition-colors"
            >
              <Play size={14} />
              Playground
            </Link>
            <Link
              href="/api-docs/examples"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium"
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
        <ExamplesClient spec={spec} baseUrl={backendUrl} />
      </main>
    </div>
  );
}
