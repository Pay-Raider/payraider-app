"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { MethodBadge } from "./MethodBadge";
import type { FlatEndpoint, OpenApiParameter } from "@/lib/openapi-types";

interface Props {
  endpoint: FlatEndpoint;
}

export function EndpointRow({ endpoint }: Props) {
  const [open, setOpen] = useState(false);
  const { path, method, operation } = endpoint;

  const params: OpenApiParameter[] = operation.parameters ?? [];
  const pathParams = params.filter((p) => p.in === "path");
  const queryParams = params.filter((p) => p.in === "query");
  const hasBody = Boolean(operation.requestBody);
  const responses = Object.entries(operation.responses ?? {});

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-expanded={open}
      >
        <span className="text-gray-400 shrink-0">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <MethodBadge method={method} />
        <code className="text-sm font-mono text-gray-100 flex-1 truncate">
          {path}
        </code>
        {operation.summary && (
          <span className="text-sm text-gray-400 hidden md:block truncate max-w-xs">
            {operation.summary}
          </span>
        )}
      </button>

      {/* Expanded detail panel */}
      {open && (
        <div className="px-4 py-4 bg-gray-900 border-t border-gray-700 space-y-4 text-sm">
          {operation.description && (
            <p className="text-gray-300 leading-relaxed">
              {operation.description}
            </p>
          )}
          {operation.summary && !operation.description && (
            <p className="text-gray-300 leading-relaxed">{operation.summary}</p>
          )}

          {pathParams.length > 0 && (
            <ParamTable title="Path Parameters" params={pathParams} />
          )}

          {queryParams.length > 0 && (
            <ParamTable title="Query Parameters" params={queryParams} />
          )}

          {hasBody && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Request Body
              </h4>
              <div className="bg-gray-800 rounded p-3 text-gray-300">
                {operation.requestBody?.description ?? "See schema below"}
                {operation.requestBody?.required && (
                  <span className="ml-2 text-xs text-rose-400">(required)</span>
                )}
              </div>
            </div>
          )}

          {responses.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Responses
              </h4>
              <div className="space-y-1">
                {responses.map(([code, resp]) => (
                  <div key={code} className="flex items-start gap-3">
                    <span
                      className={`font-mono text-xs px-1.5 py-0.5 rounded font-bold ${
                        code.startsWith("2")
                          ? "bg-emerald-900/50 text-emerald-400"
                          : code.startsWith("4")
                            ? "bg-amber-900/50 text-amber-400"
                            : code.startsWith("5")
                              ? "bg-rose-900/50 text-rose-400"
                              : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {code}
                    </span>
                    <span className="text-gray-400">{resp.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ParamTable({
  title,
  params,
}: {
  title: string;
  params: OpenApiParameter[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        {title}
      </h4>
      <div className="overflow-x-auto rounded border border-gray-700">
        <table className="w-full text-xs">
          <thead className="bg-gray-800">
            <tr>
              <th className="text-left px-3 py-2 text-gray-400 font-medium">
                Name
              </th>
              <th className="text-left px-3 py-2 text-gray-400 font-medium">
                Type
              </th>
              <th className="text-left px-3 py-2 text-gray-400 font-medium">
                Required
              </th>
              <th className="text-left px-3 py-2 text-gray-400 font-medium">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {params.map((p) => (
              <tr key={p.name} className="bg-gray-900">
                <td className="px-3 py-2 font-mono text-indigo-300">{p.name}</td>
                <td className="px-3 py-2 text-gray-400 font-mono">
                  {p.schema?.type ?? "string"}
                  {p.schema?.format ? `(${p.schema.format})` : ""}
                </td>
                <td className="px-3 py-2">
                  {p.required ? (
                    <span className="text-rose-400">yes</span>
                  ) : (
                    <span className="text-gray-600">no</span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-400">
                  {p.description ?? "—"}
                  {p.schema?.default !== undefined && (
                    <span className="ml-1 text-gray-600">
                      (default: {String(p.schema.default)})
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
