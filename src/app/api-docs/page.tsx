import React from "react";
import Link from "next/link";
import { BookOpen, Play, Code2, ExternalLink } from "lucide-react";
import {
  flattenEndpoints,
  groupByTag,
  type OpenApiSpec,
  type FlatEndpoint,
} from "@/lib/openapi-types";
import { EndpointRow } from "@/components/api-docs/EndpointRow";

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
    // fall through to public copy
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
  title: "API Documentation — Stellar Insights",
  description:
    "Interactive reference for the Stellar Insights REST API. Browse endpoints, schemas, and try requests live.",
};

export default async function ApiDocsPage() {
  const spec = await loadSpec();
  const endpoints: FlatEndpoint[] = flattenEndpoints(spec);
  const grouped = groupByTag(endpoints);
  const tagOrder = spec.tags?.map((t) => t.name) ?? [];
  const allTags = [
    ...tagOrder.filter((t) => grouped.has(t)),
    ...[...grouped.keys()].filter((t) => !tagOrder.includes(t)),
  ];
  const tagDescriptions = Object.fromEntries(
    (spec.tags ?? []).map((t) => [t.name, t.description ?? ""])
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={20} className="text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                  API Reference
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white">
                {spec.info.title}
              </h1>
              {spec.info.description && (
                <p className="mt-1 text-gray-400 max-w-2xl">
                  {spec.info.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span>
                  OpenAPI{" "}
                  <span className="text-gray-300">{spec.openapi}</span>
                </span>
                <span>
                  Version{" "}
                  <span className="text-gray-300">{spec.info.version}</span>
                </span>
                <span>
                  <span className="text-gray-300">{endpoints.length}</span>{" "}
                  endpoints across{" "}
                  <span className="text-gray-300">{allTags.length}</span> tags
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              {(spec.servers ?? []).map((s) => (
                <div key={s.url} className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      s.url.includes("localhost")
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                  />
                  <span className="font-mono text-gray-300 text-xs">
                    {s.url}
                  </span>
                  {s.description && (
                    <span className="text-gray-600">({s.description})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <nav
            className="mt-5 flex items-center gap-2 flex-wrap"
            aria-label="API docs navigation"
          >
            <Link
              href="/api-docs"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium"
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
        className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10"
        id="main-content"
      >
        {allTags.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No endpoints found in spec.
          </div>
        ) : (
          allTags.map((tag) => {
            const eps = grouped.get(tag) ?? [];
            return (
              <section key={tag} aria-labelledby={`tag-${tag}`}>
                <div className="mb-4">
                  <h2
                    id={`tag-${tag}`}
                    className="text-xl font-semibold text-white"
                  >
                    {tag}
                  </h2>
                  {tagDescriptions[tag] && (
                    <p className="mt-0.5 text-sm text-gray-400">
                      {tagDescriptions[tag]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  {eps.map((ep) => (
                    <EndpointRow
                      key={`${ep.method}-${ep.path}`}
                      endpoint={ep}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
