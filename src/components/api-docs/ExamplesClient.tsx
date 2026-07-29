"use client";

import React, { useState } from "react";
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import { MethodBadge } from "./MethodBadge";
import type {
  FlatEndpoint,
  HttpMethod,
  OpenApiSpec,
} from "@/lib/openapi-types";
import { flattenEndpoints, groupByTag } from "@/lib/openapi-types";

type LangTab = "curl" | "js" | "python";

const LANG_LABELS: Record<LangTab, string> = {
  curl: "cURL",
  js: "JavaScript",
  python: "Python",
};

interface Props {
  spec: OpenApiSpec;
  baseUrl: string;
}

export function ExamplesClient({ spec, baseUrl }: Props) {
  const endpoints = flattenEndpoints(spec);
  const grouped = groupByTag(endpoints);
  const tagOrder = spec.tags?.map((t) => t.name) ?? [];
  const allTags = [
    ...tagOrder.filter((t) => grouped.has(t)),
    ...[...grouped.keys()].filter((t) => !tagOrder.includes(t)),
  ];

  const [activeTag, setActiveTag] = useState<string>(allTags[0] ?? "");
  const [activeLang, setActiveLang] = useState<LangTab>("curl");

  if (endpoints.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No endpoints found in spec.
      </div>
    );
  }

  const visibleEndpoints = grouped.get(activeTag) ?? [];

  return (
    <div className="flex gap-6">
      {/* Tag sidebar */}
      <aside className="hidden lg:block w-52 shrink-0">
        <nav aria-label="Endpoint categories">
          <ul className="space-y-0.5">
            {allTags.map((tag) => (
              <li key={tag}>
                <button
                  onClick={() => setActiveTag(tag)}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                    activeTag === tag
                      ? "bg-indigo-600/20 text-indigo-300 font-medium"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  }`}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile tag selector */}
      <div className="lg:hidden w-full">
        <select
          value={activeTag}
          onChange={(e) => setActiveTag(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 mb-4"
          aria-label="Select endpoint category"
        >
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* Main panel */}
      <div className="flex-1 min-w-0">
        {/* Language tabs */}
        <div
          className="flex gap-1 mb-6 border-b border-gray-800"
          role="tablist"
          aria-label="Language"
        >
          {(Object.keys(LANG_LABELS) as LangTab[]).map((lang) => (
            <button
              key={lang}
              role="tab"
              aria-selected={activeLang === lang}
              onClick={() => setActiveLang(lang)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeLang === lang
                  ? "border-indigo-500 text-indigo-300"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {LANG_LABELS[lang]}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {visibleEndpoints.map((ep) => (
            <EndpointExample
              key={`${ep.method}-${ep.path}`}
              endpoint={ep}
              lang={activeLang}
              baseUrl={baseUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EndpointExample({
  endpoint,
  lang,
  baseUrl,
}: {
  endpoint: FlatEndpoint;
  lang: LangTab;
  baseUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const snippet = buildSnippet(endpoint, lang, baseUrl);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-expanded={open}
      >
        <span className="text-gray-400 shrink-0">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <MethodBadge method={endpoint.method as HttpMethod} />
        <code className="text-sm font-mono text-gray-100 flex-1 truncate">
          {endpoint.path}
        </code>
        {endpoint.operation.summary && (
          <span className="text-sm text-gray-400 hidden md:block truncate max-w-xs">
            {endpoint.operation.summary}
          </span>
        )}
      </button>

      {open && (
        <div className="relative bg-gray-950 border-t border-gray-700">
          <button
            onClick={handleCopy}
            title="Copy snippet"
            className="absolute top-2 right-2 p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors z-10"
            aria-label="Copy code snippet"
          >
            {copied ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>
          <pre className="overflow-x-auto p-4 text-xs font-mono text-gray-300 leading-relaxed whitespace-pre">
            {snippet}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ---------- snippet builders ---------- */

function buildSnippet(
  ep: FlatEndpoint,
  lang: LangTab,
  baseUrl: string
): string {
  const exampleUrl = buildExampleUrl(ep, baseUrl);
  switch (lang) {
    case "curl":
      return buildCurlSnippet(ep, exampleUrl);
    case "js":
      return buildJsSnippet(ep, exampleUrl);
    case "python":
      return buildPythonSnippet(ep, exampleUrl);
  }
}

function buildExampleUrl(ep: FlatEndpoint, baseUrl: string): string {
  let path = ep.path;
  const pathParams =
    ep.operation.parameters?.filter((p) => p.in === "path") ?? [];
  for (const p of pathParams) {
    path = path.replace(`{${p.name}}`, `<${p.name}>`);
  }
  const queryParams =
    ep.operation.parameters?.filter((p) => p.in === "query") ?? [];
  if (queryParams.length > 0) {
    const qs = queryParams
      .slice(0, 2)
      .map((p) => {
        const val =
          p.schema?.default !== undefined
            ? String(p.schema.default)
            : `<${p.name}>`;
        return `${p.name}=${val}`;
      })
      .join("&");
    path = `${path}?${qs}`;
  }
  return `${baseUrl}${path}`;
}

function exampleBody(ep: FlatEndpoint): string {
  const schema =
    ep.operation.requestBody?.content?.["application/json"]?.schema;
  if (!schema) return "{}";
  const example: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(schema.properties ?? {})) {
    if (v.type === "string") example[k] = `<${k}>`;
    else if (v.type === "number" || v.type === "integer") example[k] = 0;
    else if (v.type === "boolean") example[k] = true;
    else example[k] = null;
  }
  return JSON.stringify(example, null, 2);
}

function buildCurlSnippet(ep: FlatEndpoint, url: string): string {
  const parts = [
    `curl -X ${ep.method.toUpperCase()} \\`,
    `  '${url}' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -H 'Authorization: Bearer <your-token>'`,
  ];
  if (
    ["post", "put", "patch"].includes(ep.method) &&
    ep.operation.requestBody
  ) {
    const escaped = exampleBody(ep).replace(/'/g, "\\'");
    parts.push(`  -d '${escaped}'`);
  }
  return parts.join("\n");
}

function buildJsSnippet(ep: FlatEndpoint, url: string): string {
  const hasBody =
    ["post", "put", "patch"].includes(ep.method) && ep.operation.requestBody;
  const bodyJson = hasBody ? exampleBody(ep) : null;
  const lines: string[] = [
    `const response = await fetch(`,
    `  '${url}',`,
    `  {`,
    `    method: '${ep.method.toUpperCase()}',`,
    `    headers: {`,
    `      'Content-Type': 'application/json',`,
    `      'Authorization': 'Bearer <your-token>',`,
    `    },`,
  ];
  if (bodyJson) {
    lines.push(`    body: JSON.stringify(`);
    bodyJson.split("\n").forEach((l) => lines.push(`      ${l}`));
    lines.push(`    ),`);
  }
  lines.push(`  }`, `);`, ``, `const data = await response.json();`, `console.log(data);`);
  return lines.join("\n");
}

function buildPythonSnippet(ep: FlatEndpoint, url: string): string {
  const hasBody =
    ["post", "put", "patch"].includes(ep.method) && ep.operation.requestBody;
  const bodyJson = hasBody ? exampleBody(ep) : null;
  const lines: string[] = [
    `import requests`,
    ``,
    `headers = {`,
    `    "Content-Type": "application/json",`,
    `    "Authorization": "Bearer <your-token>",`,
    `}`,
    ``,
  ];
  if (bodyJson) {
    lines.push(`payload = ${bodyJson}`);
    lines.push(``, `response = requests.${ep.method}(`);
    lines.push(`    "${url}",`, `    headers=headers,`, `    json=payload,`, `)`);
  } else {
    lines.push(`response = requests.${ep.method}(`);
    lines.push(`    "${url}",`, `    headers=headers,`, `)`);
  }
  lines.push(``, `print(response.status_code)`, `print(response.json())`);
  return lines.join("\n");
}
