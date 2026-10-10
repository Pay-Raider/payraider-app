import type { Dispatch, SetStateAction } from "react";
import { formatAddressShort } from "@/lib/address";
import { CheckCircle, AlertCircle, Activity } from "lucide-react";

export type AnchorSortBy = "reliability" | "transactions" | "failure_rate";
export type AnchorSortOrder = "asc" | "desc";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Download,
} from "lucide-react";

const truncateAddress = (address: string) => formatAddressShort(address, 6, 4);

const handleSort = (
  column: "reliability" | "transactions" | "failure_rate",
  currentSortBy: string,
  currentDirection: "asc" | "desc",
  setSortBy: (sort: "reliability" | "transactions" | "failure_rate") => void,
  setSortDirection: (dir: "asc" | "desc") => void,
) => {
  if (currentSortBy === column) {
    setSortDirection(currentDirection === "asc" ? "desc" : "asc");
  } else {
    setSortBy(column);
    setSortDirection(column === "failure_rate" ? "asc" : "desc");
  }
};

const SortIndicator = ({
  column,
  currentSort,
  direction,
}: {
  column: string;
  currentSort: string;
  direction: "asc" | "desc";
}) => {
  if (currentSort !== column) {
    return <span className="text-muted-foreground w-4 h-4 inline-block text-center">⇕</span>;
  }
  return direction === "asc" ? (
    <span className="text-accent w-4 h-4 inline-block text-center">↑</span>
  ) : (
    <span className="text-accent w-4 h-4 inline-block text-center">↓</span>
  );
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

type Health = "healthy" | "degraded" | "down";

/** The API reports status as green/yellow/red; show what that means. */
const normalizeHealth = (status: string): Health => {
  const s = status.toLowerCase();
  if (s === "green" || s === "healthy") return "healthy";
  if (s === "yellow" || s === "degraded") return "degraded";
  return "down";
};

const HEALTH_LABEL: Record<Health, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
};

const getHealthStatusColor = (status: string) => {
  const h = normalizeHealth(status);
  if (h === "healthy") return "bg-success/12 text-success";
  if (h === "degraded") return "bg-warning/12 text-warning";
  return "bg-error/12 text-error";
};

const healthLabel = (status: string) => HEALTH_LABEL[normalizeHealth(status)];

const HealthBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getHealthStatusColor(status)}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
    {healthLabel(status)}
  </span>
);

const AVATAR_TONES = [
  "bg-[#eab069]/20 text-[#f0c48c]",
  "bg-[#9a7a5f]/25 text-[#e8d8c2]",
  "bg-[#c9803f]/20 text-[#f6cf8f]",
  "bg-[#7a5a42]/35 text-[#f4eadb]",
];

/** Initials on a warm tint picked from the name, so rows are easy to tell apart. */
const AnchorAvatar = ({ name }: { name: string }) => {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";
  const tone = AVATAR_TONES[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-sm font-semibold ${tone}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
};

const getHealthStatusIcon = (status: string) => {
  const s = status.toLowerCase();
  if (s === "green" || s === "healthy") return <CheckCircle className="w-3 h-3" />;
  if (s === "yellow" || s === "degraded") return <Activity className="w-3 h-3" />;
  return <AlertCircle className="w-3 h-3" />;
};

const Error = ({ error }: { error?: string }) => {
  return (
    <div role="alert" className="mb-6 rounded-2xl border border-error/40 bg-error/10 p-4">
      <div className="flex items-center gap-2">
        <div className="font-medium text-error">
          Error loading anchors
        </div>
      </div>
      <div className="mt-1 text-sm text-error">
        {error}
      </div>
    </div>
  );
};

const SearchAndControls = ({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  setSortOrder,
  sortOrder,
  setIsExportOpen,
}: {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  sortBy: AnchorSortBy;
  setSortBy: Dispatch<SetStateAction<AnchorSortBy>>;
  setSortOrder: Dispatch<SetStateAction<AnchorSortOrder>>;
  sortOrder: AnchorSortOrder;
  setIsExportOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex-1 relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search anchors by name or account..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-surface text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--accent-soft)]"
        />
      </div>
      <div className="flex gap-2">
        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(
              e.target.value as
                | "reliability"
                | "transactions"
                | "failure_rate",
            )
          }
          aria-label="Sort anchors by"
          className="px-3 py-2 border border-border rounded-xl bg-surface text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--accent-soft)]"
        >
          <option value="reliability">Reliability Score</option>
          <option value="transactions">Total Transactions</option>
          <option value="failure_rate">Failure Rate</option>
        </select>
        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          aria-label={sortOrder === "desc" ? "Sorted descending; switch to ascending" : "Sorted ascending; switch to descending"}
          className="px-3 py-2 border border-border rounded-xl bg-surface text-foreground hover:bg-[var(--sidebar-hover-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
        >
          {sortOrder === "desc" ? (
            <TrendingDown className="w-4 h-4" aria-hidden="true" />
          ) : (
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
        <button
          onClick={() => setIsExportOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-xl text-sm font-semibold transition hover:brightness-110"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>
    </div>
  );
};

export {
  truncateAddress,
  handleSort,
  HealthBadge,
  healthLabel,
  AnchorAvatar,
  SortIndicator,
  formatNumber,
  getHealthStatusColor,
  getHealthStatusIcon,
  Error,
  SearchAndControls,
};
