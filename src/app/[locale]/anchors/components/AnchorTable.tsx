import type { Dispatch, SetStateAction } from "react";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AnchorAvatar,
  formatNumber,
  handleSort,
  HealthBadge,
  SortIndicator,
  truncateAddress,
  type AnchorSortBy,
  type AnchorSortOrder,
} from "./helpers";
import type { AnchorMetrics } from "@/lib/api/types";

function SortableHeader({
  column,
  label,
  sortBy,
  sortOrder,
  setSortBy,
  setSortOrder,
}: {
  column: AnchorSortBy;
  label: string;
  sortBy: AnchorSortBy;
  sortOrder: AnchorSortOrder;
  setSortBy: Dispatch<SetStateAction<AnchorSortBy>>;
  setSortOrder: Dispatch<SetStateAction<AnchorSortOrder>>;
}) {
  return (
    <th scope="col" className="px-4 py-3 text-left">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => handleSort(column, sortBy, sortOrder, setSortBy, setSortOrder)}
        aria-label={`Sort by ${label.toLowerCase()}`}
      >
        {label}
        <SortIndicator column={column} currentSort={sortBy} direction={sortOrder} />
      </button>
    </th>
  );
}

function reliabilityTone(score: number) {
  if (score >= 95) return "bg-success";
  if (score >= 85) return "bg-warning";
  return "bg-error";
}

const AnchorList = ({
  sortBy,
  sortOrder,
  setSortBy,
  setSortOrder,
  paginatedAnchors,
}: {
  sortBy: AnchorSortBy;
  sortOrder: AnchorSortOrder;
  setSortBy: Dispatch<SetStateAction<AnchorSortBy>>;
  setSortOrder: Dispatch<SetStateAction<AnchorSortOrder>>;
  paginatedAnchors: AnchorMetrics[];
}) => {
  const router = useRouter();
  const sortProps = { sortBy, sortOrder, setSortBy, setSortOrder };

  return (
    <div className="hidden lg:block">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[13%]" />
          <col className="w-[17%]" />
          <col className="w-[14%]" />
          <col className="w-[9%]" />
          <col className="w-[13%]" />
          <col className="w-[4%]" />
        </colgroup>
        <thead className="border-b border-border bg-surface">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Anchor
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Status
            </th>
            <SortableHeader column="reliability" label="Reliability" {...sortProps} />
            <SortableHeader column="failure_rate" label="Success rate" {...sortProps} />
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Assets
            </th>
            <SortableHeader column="transactions" label="Transactions" {...sortProps} />
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {paginatedAnchors.map((anchor) => {
            const successRate =
              anchor.total_transactions > 0
                ? (anchor.successful_transactions / anchor.total_transactions) * 100
                : 0;
            const open = () => router.push(`/anchors/${anchor.stellar_account}`);

            return (
              <tr
                key={anchor.id}
                className="group cursor-pointer transition-colors hover:bg-[var(--sidebar-hover-bg)]"
                role="button"
                tabIndex={0}
                aria-label={`Open anchor details for ${anchor.name}`}
                onClick={open}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    open();
                  }
                }}
              >
                <td className="px-4 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <AnchorAvatar name={anchor.name} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{anchor.name}</div>
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {truncateAddress(anchor.stellar_account)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <HealthBadge status={anchor.status} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-sm font-medium tabular-nums text-foreground">
                      {anchor.reliability_score.toFixed(1)}%
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${reliabilityTone(anchor.reliability_score)}`}
                        style={{ width: `${Math.min(100, Math.max(0, anchor.reliability_score))}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-sm tabular-nums text-foreground">{successRate.toFixed(1)}%</div>
                  <div className="text-xs tabular-nums text-muted-foreground">
                    {formatNumber(anchor.successful_transactions)} / {formatNumber(anchor.total_transactions)}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm tabular-nums text-foreground">{anchor.asset_coverage}</td>
                <td className="px-4 py-3.5">
                  <div className="text-sm tabular-nums text-foreground">
                    {formatNumber(anchor.total_transactions)}
                  </div>
                  {anchor.failed_transactions > 0 && (
                    <div className="text-xs tabular-nums text-error">
                      {formatNumber(anchor.failed_transactions)} failed
                    </div>
                  )}
                </td>
                <td className="px-2 py-3.5 text-right">
                  <ChevronRight
                    className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden="true"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AnchorList;
