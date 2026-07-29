"use client";

import React from "react";
import type { HttpMethod } from "@/lib/openapi-types";

const METHOD_STYLES: Record<HttpMethod, string> = {
  get: "bg-emerald-600/20 text-emerald-400 border border-emerald-600/40",
  post: "bg-blue-600/20   text-blue-400   border border-blue-600/40",
  put: "bg-amber-600/20  text-amber-400  border border-amber-600/40",
  patch: "bg-purple-600/20 text-purple-400 border border-purple-600/40",
  delete: "bg-rose-600/20   text-rose-400   border border-rose-600/40",
  head: "bg-gray-600/20   text-gray-400   border border-gray-600/40",
  options: "bg-gray-600/20   text-gray-400   border border-gray-600/40",
};

interface Props {
  method: HttpMethod;
  className?: string;
}

export function MethodBadge({ method, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider font-mono min-w-[54px] ${METHOD_STYLES[method]} ${className}`}
    >
      {method}
    </span>
  );
}
