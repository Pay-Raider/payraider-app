"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, ArrowRight, Download } from "lucide-react";
import {
  AdvancedFilterPanel,
  applyFilters,
  type AdvancedFilterState,
} from "@/components/AdvancedFilterPanel";
import { SkeletonCorridorCard } from "@/components/ui/Skeleton";
import { Link } from "@/i18n/navigation";
import type { CorridorFilters, CorridorMetrics } from "@/lib/api/corridors";
import { useCorridors } from "@/lib/react-query/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataUnavailable } from "@/components/ui/DataUnavailable";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import { usePagination } from "@/hooks/usePagination";
import { ExportDialog } from "@/components/ExportDialog";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BookmarkButton } from "@/components/BookmarkButton";

// Lazy-load the heatmap — only rendered when the user switches to heatmap view.
const CorridorHeatmap = dynamic(
  () => import("@/components/charts/CorridorHeatmap").then((m) => ({ default: m.CorridorHeatmap })),
  { ssr: false }
);

function CorridorsPageContent() {
  const { prefs, setPrefs } = useUserPreferences();

  const [isExportOpen, setIsExportOpen] = useState(false);

  const viewMode = prefs.corridorsViewMode;
  const setViewMode = (v: typeof viewMode) =>
    setPrefs({ corridorsViewMode: v });
  const sortBy = prefs.corridorsSortBy;
  const setSortBy = (v: typeof sortBy) => setPrefs({ corridorsSortBy: v });

  const [filterState, setFilterState] = useState<AdvancedFilterState>({ query: "", filters: [] });

  // Derive searchTerm from the filter state for backward compatibility
  const searchTerm = filterState.query;
  const setSearchTerm = (q: string) => setFilterState((prev) => ({ ...prev, query: q }));

  // The page filters/paginates client-side, so request one large page.
  const corridorQuery = useCorridors({
    sort_by: sortBy,
    limit: 200,
  } satisfies CorridorFilters);
  // No sample-data fallback: an error shows DataUnavailable instead.
  const corridors = useMemo(() => corridorQuery.data?.data ?? [], [corridorQuery.data]);
  const loading = corridorQuery.isPending && !corridorQuery.isError;

  const filteredCorridors = useMemo(() => {
    // Apply advanced filters then sort
    const filtered = applyFilters(
      corridors as unknown as Record<string, unknown>[],
      filterState
    ) as unknown as CorridorMetrics[];

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "success_rate":
          return b.success_rate - a.success_rate;
        case "liquidity":
          return b.liquidity_depth_usd - a.liquidity_depth_usd;
        case "health_score":
        default:
          return b.health_score - a.health_score;
      }
    });
  }, [corridors, filterState, sortBy]);

  const {
    currentPage,
    pageSize,
    onPageChange,
    onPageSizeChange,
    startIndex,
    endIndex,
  } = usePagination(filteredCorridors.length);

  const paginatedCorridors = filteredCorridors.slice(startIndex, endIndex);

  const usd = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: n < 100 ? 2 : 1,
    }).format(n);

  const selectClass =
    "flex-1 cursor-pointer appearance-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50";

  return (
    <div>
      <PageHeader
        eyebrow="Network data"
        title="Corridors"
        description="Every asset route seen in mainnet payments over the last 24 hours, scored on how often payments through it settle."
        actions={
          <>
            <Link
              href="/corridors/compare"
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-[var(--sidebar-hover-bg)]"
            >
              Compare
            </Link>
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:brightness-110"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </button>
          </>
        }
      />

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        type="corridors"
        title="Payment Corridors"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <AdvancedFilterPanel
            fields={[
              { key: "source_asset", label: "Source Asset", type: "text", placeholder: "e.g. USDC" },
              { key: "destination_asset", label: "Dest Asset", type: "text", placeholder: "e.g. XLM" },
              { key: "success_rate", label: "Success Rate (%)", type: "number", placeholder: "e.g. 95" },
              { key: "health_score", label: "Health Score", type: "range", min: 0, max: 100, step: 1 },
            ]}
            onChange={setFilterState}
            storageKey="corridors_advanced_filter"
            placeholder="Search corridors…"
          />
        </div>
        <div className="flex gap-2 lg:col-span-4">
          <select
            aria-label="Sort corridors"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "success_rate" | "health_score" | "liquidity")
            }
            className={selectClass}
          >
            <option value="health_score">Sort: Health</option>
            <option value="success_rate">Sort: Success rate</option>
            <option value="liquidity">Sort: Volume</option>
          </select>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
            {(["grid", "heatmap"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  viewMode === mode
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {corridorQuery.isError && !corridorQuery.data ? (
        <DataUnavailable
          what="corridors"
          onRetry={() => corridorQuery.refetch()}
          retrying={corridorQuery.isFetching}
        />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCorridorCard key={i} />
          ))}
        </div>
      ) : filteredCorridors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-20">
          <AlertCircle className="mb-4 h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-muted-foreground">No corridors match these filters.</p>
        </div>
      ) : viewMode === "heatmap" ? (
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <h2 className="text-xl font-semibold text-foreground">Corridor health</h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            Health score for each source and destination pair.
          </p>
          <CorridorHeatmap corridors={filteredCorridors} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {paginatedCorridors.map((corridor) => {
            const tone =
              corridor.health_score >= 80
                ? { text: "text-success", bar: "bg-success", label: "Healthy" }
                : corridor.health_score >= 50
                  ? { text: "text-warning", bar: "bg-warning", label: "Caution" }
                  : { text: "text-error", bar: "bg-error", label: "Poor" };
            return (
              <Link
                key={corridor.id}
                href={`/corridors/${corridor.id}`}
                className="lift group block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-2 truncate text-lg font-semibold text-foreground">
                      <span className="truncate">{corridor.source_asset}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="truncate">{corridor.destination_asset}</span>
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {corridor.total_attempts.toLocaleString()} payment
                      {corridor.total_attempts === 1 ? "" : "s"} seen
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium ${tone.text}`}>
                    {tone.label}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">Health score</span>
                    <span className={`font-semibold tabular-nums ${tone.text}`}>
                      {corridor.health_score.toFixed(0)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${tone.bar}`}
                      style={{ width: `${Math.min(100, Math.max(0, corridor.health_score))}%` }}
                    />
                  </div>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Success rate</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
                      {corridor.success_rate.toFixed(1)}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Observed volume</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
                      {corridor.liquidity_depth_usd > 0 ? usd(corridor.liquidity_depth_usd) : "Unpriced"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-center justify-between">
                  <BookmarkButton
                    id={corridor.id}
                    type="corridor"
                    label={`${corridor.source_asset} → ${corridor.destination_asset}`}
                    href={`/corridors/${corridor.id}`}
                    className="touch-sm"
                  />
                  <span className="text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    Details →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {filteredCorridors.length > 0 && (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}–{Math.min(endIndex, filteredCorridors.length)} of{" "}
            {filteredCorridors.length} corridors
          </p>
          <DataTablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredCorridors.length}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}

export default function CorridorsPage() {
  return (
    <ErrorBoundary>
      <CorridorsPageContent />
    </ErrorBoundary>
  );
}