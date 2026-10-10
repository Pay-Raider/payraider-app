"use client";

import { useMemo, useState } from "react";
import { Braces, FileText, Table } from "lucide-react";
import { useCorridors } from "@/lib/react-query/queries";
import { generateCSV, generateExcel, generateJSON } from "@/lib/export-utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataUnavailable } from "@/components/ui/DataUnavailable";
import { Skeleton } from "@/components/ui/Skeleton";

const COLUMNS = [
  { id: "corridor", label: "Corridor" },
  { id: "source_asset", label: "Source asset" },
  { id: "destination_asset", label: "Destination asset" },
  { id: "health_score", label: "Health score" },
  { id: "success_rate", label: "Success rate (%)" },
  { id: "total_attempts", label: "Payments seen" },
  { id: "failed_payments", label: "Failed" },
  { id: "volume_usd", label: "Settled volume (USD)" },
] as const;

type ColumnId = (typeof COLUMNS)[number]["id"];

/**
 * Exports the live corridor table. This page used to export numbers
 * generated in the browser; everything here now comes from the backend's
 * 24-hour window of mainnet payments.
 */
export default function ExportPage() {
  const query = useCorridors({ sort_by: "health_score", limit: 200 });
  const [selected, setSelected] = useState<Set<ColumnId>>(
    () => new Set(COLUMNS.map((c) => c.id)),
  );

  const rows = useMemo(
    () =>
      (query.data?.data ?? []).map((c) => ({
        corridor: c.id,
        source_asset: c.source_asset,
        destination_asset: c.destination_asset,
        health_score: Number(c.health_score.toFixed(1)),
        success_rate: Number(c.success_rate.toFixed(2)),
        total_attempts: c.total_attempts,
        failed_payments: c.failed_payments,
        volume_usd: Number(c.liquidity_depth_usd.toFixed(2)),
      })),
    [query.data],
  );
  const columns = COLUMNS.filter((c) => selected.has(c.id));

  const toggle = (id: ColumnId) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const formats = [
    { label: "CSV", icon: FileText, run: () => generateCSV(rows, columns) },
    { label: "Excel", icon: Table, run: () => generateExcel(rows, columns, "Corridors") },
    { label: "JSON", icon: Braces, run: () => generateJSON(rows, columns) },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="Export data"
        description="Download the current corridor table, measured over the last 24 hours of mainnet payments."
      />

      {query.isError && !query.data ? (
        <DataUnavailable what="corridors" onRetry={() => query.refetch()} retrying={query.isFetching} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="space-y-6 lg:col-span-4">
            <fieldset className="rounded-2xl border border-border bg-card p-5">
              <legend className="px-1 text-sm font-semibold text-foreground">Columns</legend>
              <div className="mt-2 space-y-1">
                {COLUMNS.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-[var(--sidebar-hover-bg)]">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">Download</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {rows.length} corridor{rows.length === 1 ? "" : "s"}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {formats.map(({ label, icon: Icon, run }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={run}
                    disabled={rows.length === 0 || columns.length === 0}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:brightness-110 disabled:opacity-50"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-2xl border border-border bg-card lg:col-span-8">
            <div className="border-b border-border bg-surface px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">Preview</h2>
              <p className="text-xs text-muted-foreground">First 8 rows</p>
            </div>
            {query.isPending ? (
              <div className="space-y-2 p-5">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : columns.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">Pick at least one column.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {columns.map((c) => (
                        <th key={c.id} scope="col" className="whitespace-nowrap px-4 py-2.5 text-left font-medium text-muted-foreground">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.slice(0, 8).map((row) => (
                      <tr key={row.corridor}>
                        {columns.map((c) => (
                          <td key={c.id} className="max-w-[16rem] truncate whitespace-nowrap px-4 py-2.5 tabular-nums text-foreground">
                            {String(row[c.id])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
