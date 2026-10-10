"use client";
import { Search } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import { ExportDialog } from "@/components/ExportDialog";
import {
  formatNumber,
  Error,
  healthLabel,
  SearchAndControls
} from "./helpers";
import { SkeletonTable } from "@/components/ui/Skeleton";
import useAnchorPage from "./useAnchorPage";
import AnchorList from "./AnchorTable";
import AnchorCards from "./AnchorCards";


const AnchorsPageContent = () => {
  const {
    anchors,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    isExportOpen,
    setIsExportOpen,
    currentPage,
    pageSize,
    onPageChange,
    onPageSizeChange,
    paginatedAnchors, sortedAndFilteredAnchors
  } = useAnchorPage()


  return (
    <MainLayout>
      <div>
        {/* Page Header */}
        <header className="mb-8 max-w-2xl">
          <p className="text-sm font-medium text-accent">Network data</p>
          <h1 className="mt-2 text-4xl font-semibold text-foreground md:text-5xl">Anchors</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Reliability, asset coverage and transaction success for the anchors that move money on Stellar.
          </p>
        </header>

        {/* Error Message */}
        {error && (
          <Error error={error} />
        )}

        {/* Summary Stats */}
        {!loading && !error && sortedAndFilteredAnchors.length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Anchors", value: String(sortedAndFilteredAnchors.length), tone: "text-foreground" },
              {
                label: "Average reliability",
                value: `${(
                  sortedAndFilteredAnchors.reduce((sum, a) => sum + a.reliability_score, 0) /
                  sortedAndFilteredAnchors.length
                ).toFixed(1)}%`,
                tone: "text-foreground",
              },
              {
                label: "Transactions",
                value: formatNumber(sortedAndFilteredAnchors.reduce((sum, a) => sum + a.total_transactions, 0)),
                tone: "text-foreground",
              },
              {
                label: "Healthy",
                value: `${sortedAndFilteredAnchors.filter((a) => healthLabel(a.status) === "Healthy").length} of ${sortedAndFilteredAnchors.length}`,
                tone: "text-success",
              },
            ].map((stat) => (
              <div key={stat.label} className="lift rounded-2xl border border-border bg-card p-5">
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className={`mt-1 font-display text-3xl font-semibold tabular-nums ${stat.tone}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        <SearchAndControls
          searchTerm={searchTerm} setSearchTerm={setSearchTerm} sortBy={sortBy} setSortBy={setSortBy} setSortOrder={setSortOrder} sortOrder={sortOrder} setIsExportOpen={setIsExportOpen}
        />

        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {loading ? (
              <SkeletonTable rows={8} />
            ) : (
              <>
                <AnchorList sortBy={sortBy}
                  sortOrder={sortOrder}
                  setSortBy={setSortBy}
                  setSortOrder={setSortOrder}
                  paginatedAnchors={paginatedAnchors} />
                <AnchorCards paginatedAnchors={paginatedAnchors} />
              </>
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && sortedAndFilteredAnchors.length > 0 && (
            <DataTablePagination
              totalItems={sortedAndFilteredAnchors.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          )}
        </div>

        {/* Empty State (when no error but also no data) */}
        {!loading &&
          !error &&
          sortedAndFilteredAnchors.length === 0 &&
          anchors.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border bg-card p-12 text-center">
              <Search className="mx-auto mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <p className="text-muted-foreground">
                No anchors found matching &quot;{searchTerm}&quot;
              </p>
            </div>
          )}
      </div>
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        type="anchors"
        title="Stellar Anchors"
      />
    </MainLayout>
  );
};

export default AnchorsPageContent;