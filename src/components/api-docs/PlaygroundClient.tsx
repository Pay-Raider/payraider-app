"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Play,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { MethodBadge } from "./MethodBadge";
import type {
  FlatEndpoint,
  HttpMethod,
  OpenApiParameter,
  OpenApiSpec,
} from "@/lib/openapi-types";
import { flattenEndpoints } from "@/lib/openapi-types";

interface Props {
  spec: OpenApiSpec;
  baseUrl: string;
}

interface RequestState {
  loading: boolean;
  status: number | null;
  statusText: string;
  body: string;
  headers: Record<string, string>;
  elapsed: number | null;
  error: string | null;
}

const INITIAL_REQUEST: RequestState = {
  loading: false,
  status: null,
  statusText: "",
  body: "",
  headers: {},
  elapsed: null,
  error: null,
};

export function PlaygroundClient({ spec, baseUrl }: Props) {
  const endpoints = useMemo(() => flattenEndpoints(spec), [spec]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [pathValues, setPathValues] = useState<Record<string, string>>({});
  const [queryValues, setQueryValues] = useState<Record<string, string>>({});
  const [bodyValue, setBodyValue] = useState("");
  const [bearerToken, setBearerToken] = useState("");
  const [request, setRequest] = useState<RequestState>(INITIAL_REQUEST);
  const [copied, setCopied] = useState(false);

  const selected = endpoints[selectedIndex];

  const selectEndpoint = (index: number) => {
    setSelectedIndex(index);
    setSelectorOpen(false);
    setPathValues({});
    setQueryValues({});
    setBodyValue("");
    setRequest(INITIAL_REQUEST);
  };

  const buildUrl = useCallback((): string => {
    if (!selected) return baseUrl;
    let path = selected.path;
    for (const [k, v] of Object.entries(pathValues)) {
      path = path.replace(`{${k}}`, encodeURIComponent(v));
    }
    const qs = Object.entries(queryValues)
      .filter(([, v]) => v !== "")
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
      )
      .join("&");
    return `${baseUrl}${path}${qs ? `?${qs}` : ""}`;
  }, [selected, pathValues, queryValues, baseUrl]);

  const sendRequest = async () => {
    if (!selected) return;
    setRequest({ ...INITIAL_REQUEST, loading: true });

    const url = buildUrl();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (bearerToken) headers["Authorization"] = `Bearer ${bearerToken}`;

    const init: RequestInit = {
      method: selected.method.toUpperCase(),
      headers,
    };

    const hasBody =
      ["post", "put", "patch"].includes(selected.method) &&
      bodyValue.trim() !== "";
    if (hasBody) init.body = bodyValue;

    const start = performance.now();
    try {
      const res = await fetch(url, init);
      const elapsed = Math.round(performance.now() - start);
      const respHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        respHeaders[k] = v;
      });

      let body = "";
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        const json = await res.json();
        body = JSON.stringify(json, null, 2);
      } else {
        body = await res.text();
      }

      setRequest({
        loading: false,
        status: res.status,
        statusText: res.statusText,
        body,
        headers: respHeaders,
        elapsed,
        error: null,
      });
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      setRequest({
        loading: false,
        status: null,
        statusText: "",
        body: "",
        headers: {},
        elapsed,
        error: err instanceof Error ? err.message : "Network error",
      });
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(request.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (endpoints.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No endpoints available in spec.
      </div>
    );
  }

  const pathParams: OpenApiParameter[] =
    selected?.operation.parameters?.filter((p) => p.in === "path") ?? [];
  const queryParams: OpenApiParameter[] =
    selected?.operation.parameters?.filter((p) => p.in === "query") ?? [];
  const supportsBody =
    selected &&
    ["post", "put", "patch"].includes(selected.method) &&
    selected.operation.requestBody;

  const statusColor =
    request.status === null
      ? ""
      : request.status < 300
        ? "text-emerald-400"
        : request.status < 400
          ? "text-amber-400"
          : "text-rose-400";

  const currentUrl = buildUrl();
  const curlSnippet = buildCurl(selected, currentUrl, bodyValue, bearerToken);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left — Request builder */}
      <div className="space-y-5">
        {/* Endpoint selector */}
        <div>
          <label
            htmlFor="endpoint-selector"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"
          >
            Endpoint
          </label>
          <div className="relative">
            <button
              id="endpoint-selector"
              onClick={() => setSelectorOpen((v) => !v)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-expanded={selectorOpen}
              aria-haspopup="listbox"
            >
              <MethodBadge method={selected.method as HttpMethod} />
              <code className="text-sm font-mono text-gray-100 flex-1 truncate">
                {selected.path}
              </code>
              {selectorOpen ? (
                <ChevronDown size={14} className="text-gray-400 shrink-0" />
              ) : (
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
              )}
            </button>

            {selectorOpen && (
              <div
                role="listbox"
                className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-xl"
              >
                {endpoints.map((ep, i) => (
                  <button
                    key={`${ep.method}-${ep.path}`}
                    role="option"
                    aria-selected={i === selectedIndex}
                    onClick={() => selectEndpoint(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-800 transition-colors ${
                      i === selectedIndex ? "bg-gray-800" : ""
                    }`}
                  >
                    <MethodBadge method={ep.method as HttpMethod} />
                    <code className="font-mono text-gray-200 truncate">
                      {ep.path}
                    </code>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selected.operation.summary && (
            <p className="mt-1.5 text-sm text-gray-400">
              {selected.operation.summary}
            </p>
          )}
        </div>

        {/* Path parameters */}
        {pathParams.length > 0 && (
          <FieldGroup title="Path Parameters">
            {pathParams.map((p) => (
              <LabeledInput
                key={p.name}
                label={p.name}
                required={p.required}
                placeholder={p.description ?? p.name}
                value={pathValues[p.name] ?? ""}
                onChange={(v) =>
                  setPathValues((prev) => ({ ...prev, [p.name]: v }))
                }
              />
            ))}
          </FieldGroup>
        )}

        {/* Query parameters */}
        {queryParams.length > 0 && (
          <FieldGroup title="Query Parameters">
            {queryParams.map((p) => (
              <LabeledInput
                key={p.name}
                label={p.name}
                required={p.required}
                placeholder={
                  p.schema?.default !== undefined
                    ? String(p.schema.default)
                    : (p.description ?? p.name)
                }
                value={queryValues[p.name] ?? ""}
                onChange={(v) =>
                  setQueryValues((prev) => ({ ...prev, [p.name]: v }))
                }
              />
            ))}
          </FieldGroup>
        )}

        {/* Request body */}
        {supportsBody && (
          <FieldGroup title="Request Body (JSON)">
            <textarea
              value={bodyValue}
              onChange={(e) => setBodyValue(e.target.value)}
              rows={6}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 font-mono text-sm text-gray-200 focus:outline-none focus:border-indigo-500 resize-y"
              placeholder="{}"
              spellCheck={false}
              aria-label="Request body JSON"
            />
          </FieldGroup>
        )}

        {/* Auth */}
        <FieldGroup title="Authorization (optional)">
          <LabeledInput
            label="Bearer Token"
            required={false}
            placeholder="eyJhbGci..."
            value={bearerToken}
            onChange={setBearerToken}
            type="password"
          />
        </FieldGroup>

        {/* URL preview */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Request URL
          </p>
          <code className="block text-xs font-mono text-indigo-300 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 break-all">
            {currentUrl}
          </code>
        </div>

        {/* Send button */}
        <button
          onClick={sendRequest}
          disabled={request.loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {request.loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Play size={16} />
              Send Request
            </>
          )}
        </button>

        {/* cURL snippet */}
        <details className="group">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors list-none flex items-center gap-1.5">
            <ChevronRight
              size={12}
              className="transition-transform group-open:rotate-90"
            />
            cURL equivalent
          </summary>
          <pre className="mt-2 bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap break-all">
            {curlSnippet}
          </pre>
        </details>
      </div>

      {/* Right — Response */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Response
          </p>
          {request.status !== null && (
            <div className="flex items-center gap-3 text-sm">
              <span className={`font-bold font-mono ${statusColor}`}>
                {request.status} {request.statusText}
              </span>
              {request.elapsed !== null && (
                <span className="text-gray-500 text-xs">
                  {request.elapsed} ms
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 relative bg-gray-900 border border-gray-700 rounded-lg overflow-hidden min-h-[300px]">
          {!request.loading && request.status === null && !request.error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
              <Play size={32} className="mb-2 opacity-30" />
              <p className="text-sm">
                Hit &ldquo;Send Request&rdquo; to see the response
              </p>
            </div>
          )}

          {request.loading && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <Loader2 size={24} className="animate-spin" />
            </div>
          )}

          {!request.loading && request.error && (
            <div className="p-4 text-rose-400 text-sm font-mono">
              Error: {request.error}
            </div>
          )}

          {!request.loading && !request.error && request.body && (
            <>
              <button
                onClick={handleCopy}
                title="Copy response"
                className="absolute top-2 right-2 p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors z-10"
                aria-label="Copy response body"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              <pre className="h-full overflow-auto p-4 text-xs font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
                {request.body}
              </pre>
            </>
          )}
        </div>

        {!request.loading && Object.keys(request.headers).length > 0 && (
          <details className="mt-3 group">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors list-none flex items-center gap-1.5">
              <ChevronRight
                size={12}
                className="transition-transform group-open:rotate-90"
              />
              Response Headers
            </summary>
            <div className="mt-2 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              {Object.entries(request.headers).map(([k, v]) => (
                <div
                  key={k}
                  className="flex gap-2 px-3 py-1 text-xs border-b border-gray-800 last:border-0"
                >
                  <span className="font-mono text-indigo-300 shrink-0">
                    {k}:
                  </span>
                  <span className="font-mono text-gray-400 break-all">{v}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function LabeledInput({
  label,
  required,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="w-32 shrink-0 text-xs font-mono text-indigo-300">
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
      />
    </div>
  );
}

function buildCurl(
  ep: FlatEndpoint | undefined,
  url: string,
  body: string,
  token: string
): string {
  if (!ep) return "";
  const parts: string[] = [`curl -X ${ep.method.toUpperCase()}`];
  parts.push(`  '${url}'`);
  parts.push(`  -H 'Content-Type: application/json'`);
  if (token) parts.push(`  -H 'Authorization: Bearer ${token}'`);
  if (["post", "put", "patch"].includes(ep.method) && body.trim()) {
    parts.push(`  -d '${body.replace(/'/g, "\\'")}'`);
  }
  return parts.join(" \\\n");
}
