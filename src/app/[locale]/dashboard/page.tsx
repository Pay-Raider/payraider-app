"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api/api";
import type { CorridorMetrics } from "@/lib/api/corridors";
import { useCorridors } from "@/lib/react-query/queries";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataUnavailable } from "@/components/ui/DataUnavailable";
import { Skeleton } from "@/components/ui/Skeleton";
import { BookmarksDashboardWidget } from "@/components/BookmarksDashboardWidget";

const REFRESH_MS = 30_000;

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
      {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
    </div>
  );
}

function tone(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-error";
}

function CorridorRow({ c, metric }: { c: CorridorMetrics; metric: string }) {
  return (
    <li>
      <Link
        href={`/corridors/${c.id}`}
        className="group flex items-center gap-3 py-3 transition-colors hover:text-accent"
      >
        <span className="min-w-0 flex-1 truncate font-medium text-foreground group-hover:text-accent">
          {c.source_asset} → {c.destination_asset}
        </span>
        <span className="text-sm tabular-nums text-muted-foreground">{metric}</span>
        <span className={`w-10 text-right text-sm font-semibold tabular-nums ${tone(c.health_score)}`}>
          {c.health_score.toFixed(0)}
        </span>
      </Link>
    </li>
  );
}

function Panel({ title, description, href, children }: {
  title: string;
  description: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {href && (
          <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent hover:underline">
            All <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * Overview of the corridor table. Every figure is computed from the
 * backend's 24-hour window of mainnet payments; there are no trend arrows
 * because no earlier window is stored to compare against.
 */
export default function DashboardPage() {
  const corridors = useCorridors({ sort_by: "health_score", limit: 200 });
  const ledger = useQuery({
    queryKey: ["ledger-latest"],
    queryFn: () => api.get<{ sequence: number; closed_at: string }>("/rpc/ledger/latest"),
    refetchInterval: REFRESH_MS,
  });

  const list = useMemo(() => corridors.data?.data ?? [], [corridors.data]);
  const summary = useMemo(() => {
    const attempts = list.reduce((n, c) => n + c.total_attempts, 0);
    const settled = list.reduce((n, c) => n + c.successful_payments, 0);
    const volume = list.reduce((n, c) => n + c.liquidity_depth_usd, 0);

    const assets = new Map<string, { volume: number; corridors: number; payments: number }>();
    for (const c of list) {
      const a = assets.get(c.source_asset) ?? { volume: 0, corridors: 0, payments: 0 };
      assets.set(c.source_asset, {
        volume: a.volume + c.liquidity_depth_usd,
        corridors: a.corridors + 1,
        payments: a.payments + c.total_attempts,
      });
    }

    return {
      attempts,
      successRate: attempts > 0 ? (settled / attempts) * 100 : 0,
      volume,
      busiest: [...list].sort((a, b) => b.liquidity_depth_usd - a.liquidity_depth_usd).slice(0, 6),
      // Corridors with enough traffic to matter that are not doing well.
      attention: list
        .filter((c) => c.total_attempts >= 5 && c.health_score < 50)
        .sort((a, b) => a.health_score - b.health_score)
        .slice(0, 6),
      assets: [...assets.entries()].sort((a, b) => b[1].volume - a[1].volume).slice(0, 6),
    };
  }, [list]);

  const header = (
    <PageHeader
      eyebrow="Overview"
      title="Dashboard"
      description="The state of Stellar payment corridors over the last 24 hours of mainnet payments."
    />
  );

  if (corridors.isError && !corridors.data) {
    return (
      <div>
        {header}
        <DataUnavailable what="the dashboard" onRetry={() => corridors.refetch()} retrying={corridors.isFetching} />
      </div>
    );
  }

  if (corridors.isPending) {
    return (
      <div>
        {header}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Payment success rate"
          value={`${summary.successRate.toFixed(1)}%`}
          detail={`Across ${summary.attempts.toLocaleString()} payments`}
        />
        <Stat label="Active corridors" value={list.length.toLocaleString()} detail="Seen in the last 24 hours" />
        <Stat label="Settled volume" value={usd.format(summary.volume)} detail="Priced assets only" />
        <Stat
          label="Latest ledger"
          value={ledger.data ? ledger.data.sequence.toLocaleString() : "—"}
          detail={ledger.data ? new Date(ledger.data.closed_at).toLocaleTimeString() : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Busiest corridors" description="By settled dollar volume." href="/corridors">
          <ul className="mt-3 divide-y divide-border">
            {summary.busiest.map((c) => (
              <CorridorRow key={c.id} c={c} metric={c.liquidity_depth_usd > 0 ? usd.format(c.liquidity_depth_usd) : "Unpriced"} />
            ))}
          </ul>
        </Panel>

        <Panel title="Needs attention" description="Corridors with at least 5 payments and a health score under 50.">
          {summary.attention.length > 0 ? (
            <ul className="mt-3 divide-y divide-border">
              {summary.attention.map((c) => (
                <CorridorRow key={c.id} c={c} metric={`${c.success_rate.toFixed(0)}% settled`} />
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No busy corridor is struggling right now.
            </p>
          )}
        </Panel>

        <Panel title="Top source assets" description="Assets sent most, by settled dollar volume.">
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th scope="col" className="py-2 text-left font-medium">Asset</th>
                <th scope="col" className="py-2 text-right font-medium">Corridors</th>
                <th scope="col" className="py-2 text-right font-medium">Payments</th>
                <th scope="col" className="py-2 text-right font-medium">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summary.assets.map(([asset, a]) => (
                <tr key={asset}>
                  <td className="py-2.5 font-medium text-foreground">{asset}</td>
                  <td className="py-2.5 text-right tabular-nums text-muted-foreground">{a.corridors}</td>
                  <td className="py-2.5 text-right tabular-nums text-muted-foreground">{a.payments.toLocaleString()}</td>
                  <td className="py-2.5 text-right tabular-nums text-foreground">{a.volume > 0 ? usd.format(a.volume) : "Unpriced"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <BookmarksDashboardWidget />
      </div>
    </div>
  );
}
