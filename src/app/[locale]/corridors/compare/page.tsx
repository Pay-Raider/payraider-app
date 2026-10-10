"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Download, Share2, X } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import type { CorridorMetrics } from "@/lib/api/corridors";
import { useCorridorDetails, useCorridors } from "@/lib/react-query/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataUnavailable } from "@/components/ui/DataUnavailable";
import { Skeleton } from "@/components/ui/Skeleton";

const MAX = 4;

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const ROWS: { label: string; value: (c: CorridorMetrics) => number; format: (n: number) => string }[] = [
  { label: "Health score", value: (c) => c.health_score, format: (n) => n.toFixed(0) },
  { label: "Success rate", value: (c) => c.success_rate, format: (n) => `${n.toFixed(1)}%` },
  { label: "Payments seen", value: (c) => c.total_attempts, format: (n) => n.toLocaleString() },
  { label: "Failed", value: (c) => -c.failed_payments, format: (n) => (-n).toLocaleString() },
  { label: "Settled volume (24h)", value: (c) => c.liquidity_depth_usd, format: (n) => (n > 0 ? usd.format(n) : "Unpriced") },
];

function label(c: Pick<CorridorMetrics, "source_asset" | "destination_asset">) {
  return `${c.source_asset} → ${c.destination_asset}`;
}

function ComparisonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedIds = useMemo(
    () => (searchParams.get("ids") || "").split(",").filter(Boolean).slice(0, MAX),
    [searchParams],
  );
  const [copied, setCopied] = useState(false);

  const list = useCorridors({ sort_by: "health_score", limit: 200 });
  const { data: details, isPending } = useCorridorDetails(selectedIds);
  const corridors = details.filter(Boolean).map((d) => d!.corridor);
  const missing = selectedIds.filter((id, i) => !isPending && !details[i]);

  const setIds = (ids: string[]) =>
    router.push(ids.length ? `/corridors/compare?ids=${ids.join(",")}` : "/corridors/compare");

  const exportCsv = () => {
    const header = ["Corridor", ...ROWS.map((r) => r.label)];
    const lines = corridors.map((c) => [label(c), ...ROWS.map((r) => r.format(r.value(c)))]);
    const csv = [header, ...lines].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `corridor-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const options = (list.data?.data ?? []).filter((c) => !selectedIds.includes(c.id));
  const button =
    "inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-[var(--sidebar-hover-bg)] disabled:opacity-50";

  return (
    <div>
      <PageHeader
        eyebrow="Corridors"
        title="Compare corridors"
        description={`Put up to ${MAX} corridors side by side, measured over the same 24 hours of mainnet payments.`}
        actions={
          corridors.length > 0 && (
            <>
              <button type="button" onClick={exportCsv} className={button}>
                <Download className="h-4 w-4" aria-hidden="true" />
                CSV
              </button>
              <button type="button" onClick={share} className={button}>
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
                {copied ? "Link copied" : "Share"}
              </button>
            </>
          )
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {selectedIds.map((id) => {
          const c = corridors.find((x) => x.id === id);
          return (
            <span key={id} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-3 pr-1 text-sm text-foreground">
              {c ? label(c) : id.split("->").map((a) => a.split(":")[0]).join(" → ")}
              <button
                type="button"
                onClick={() => setIds(selectedIds.filter((x) => x !== id))}
                aria-label={`Remove ${id}`}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          );
        })}
        {selectedIds.length < MAX && (
          <select
            aria-label="Add a corridor"
            value=""
            disabled={!list.data}
            onChange={(e) => e.target.value && setIds([...selectedIds, e.target.value])}
            className="cursor-pointer rounded-full border border-dashed border-border bg-transparent px-3 py-1.5 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="">{list.data ? "+ Add a corridor" : "Loading corridors…"}</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {label(c)} · {c.total_attempts} payments
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedIds.length === 0 ? (
        list.isError ? (
          <DataUnavailable what="corridors" onRetry={() => list.refetch()} retrying={list.isFetching} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <h2 className="text-xl font-semibold text-foreground">Pick corridors to compare</h2>
            <p className="mt-2 text-muted-foreground">
              Use “Add a corridor” above, or browse the{" "}
              <Link href="/corridors" className="font-medium text-accent hover:underline">
                corridor list
              </Link>
              .
            </p>
          </div>
        )
      ) : isPending ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : corridors.length === 0 ? (
        <DataUnavailable what="these corridors" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[540px] text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Metric
                </th>
                {corridors.map((c) => (
                  <th key={c.id} scope="col" className="px-4 py-3 text-left font-semibold text-foreground">
                    <Link href={`/corridors/${c.id}`} className="hover:text-accent">
                      {label(c)}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ROWS.map((row) => {
                const best = corridors.length > 1 ? Math.max(...corridors.map(row.value)) : null;
                return (
                  <tr key={row.label}>
                    <th scope="row" className="px-4 py-3 text-left font-normal text-muted-foreground">
                      {row.label}
                    </th>
                    {corridors.map((c) => {
                      const v = row.value(c);
                      return (
                        <td
                          key={c.id}
                          className={`px-4 py-3 tabular-nums ${v === best ? "font-semibold text-success" : "text-foreground"}`}
                        >
                          {row.format(v)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {missing.length > 0 && (
        <p className="mt-4 text-sm text-warning">
          No payments seen in the last 24 hours for: {missing.join(", ")}
        </p>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-2xl" />}>
      <ComparisonContent />
    </Suspense>
  );
}
