import { AnchorAvatar, formatNumber, HealthBadge, truncateAddress } from "./helpers";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AnchorMetrics } from "@/lib/api/types";

const AnchorCards = ({
  paginatedAnchors
}: {
  paginatedAnchors: AnchorMetrics[];
}) => {
  const router = useRouter()
  return (
    <div className="lg:hidden divide-y divide-gray-200 dark:divide-slate-700">
      {paginatedAnchors.map((anchor) => {
        const successRate =
          anchor.total_transactions > 0
            ? (anchor.successful_transactions / anchor.total_transactions) * 100
            : 0;

        return (
          <article
            key={anchor.id}
            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            role="button"
            tabIndex={0}
            aria-label={`Open anchor details for ${anchor.name}`}
            onClick={() => router.push(`/anchors/${anchor.stellar_account}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                router.push(`/anchors/${anchor.stellar_account}`);
              }
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <span className="mr-3">
                  <AnchorAvatar name={anchor.name} />
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {anchor.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {truncateAddress(anchor.stellar_account)}
                  </div>
                </div>
              </div>
              <HealthBadge status={anchor.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Reliability
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                    {anchor.reliability_score.toFixed(1)}%
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${anchor.reliability_score >= 95
                        ? "bg-green-500"
                        : anchor.reliability_score >= 85
                          ? "bg-yellow-500"
                          : "bg-red-500"
                        }`}
                      style={{
                        width: `${anchor.reliability_score}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Success Rate
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {successRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Assets
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {anchor.asset_coverage}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Transactions
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatNumber(anchor.total_transactions)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                href={`/anchors/${anchor.stellar_account}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-accent"
                onClick={(e) => e.stopPropagation()}
              >
                Details
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default AnchorCards;