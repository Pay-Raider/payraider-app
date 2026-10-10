"use client";

import { useParams } from "next/navigation";
import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import type { CorridorMetrics } from "@/lib/api/corridors";
import { useCorridorDetail, useRealtimeCacheSync } from "@/lib/react-query/queries";
import { SuccessRateChart, VolumeByHourChart } from "@/components/corridor-charts";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataUnavailable } from "@/components/ui/DataUnavailable";
import { useRealtimeCorridors } from "@/hooks/useRealtimeCorridors";
import { Link } from "@/i18n/navigation";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { BackButton } from "@/components/ui/BackButton";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

function healthTone(score: number) {
  if (score >= 80) return { text: "text-success", label: "Healthy" };
  if (score >= 50) return { text: "text-warning", label: "Caution" };
  return { text: "text-error", label: "Poor" };
}

/** "USDC:GA5Z…KZVN" -> issuer for display; native XLM has none. */
function issuerOf(asset: string | undefined) {
  const issuer = asset?.split(":")[1];
  if (!issuer || issuer === "native") return "Native asset";
  return `${issuer.slice(0, 4)}…${issuer.slice(-4)}`;
}

function Stat({ label, value, detail, tone = "text-foreground" }: {
  label: string;
  value: string;
  detail?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${tone}`}>{value}</p>
      {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
    </div>
  );
}

export default function CorridorDetailPage() {
  const params = useParams();
  const corridorPair = decodeURIComponent(params.pair as string);
  const [sourceKey, destKey] = corridorPair.split("->");
  const cacheSync = useRealtimeCacheSync();
  const detailQuery = useCorridorDetail(corridorPair);
  const data = detailQuery.data;

  const { healthAlerts } = useRealtimeCorridors({
    corridorKeys: corridorPair ? [corridorPair] : [],
    enablePaymentStream: false,
    // Patches the cached corridor so every view of it updates together.
    onCorridorUpdate: (update) => cacheSync.onCorridorUpdate(update),
  });

  const back = <BackButton fallbackHref="/corridors" label="All corridors" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline" />;

  if (detailQuery.isPending) {
    return (
      <div>
        {back}
        <Skeleton className="mb-3 h-5 w-24" />
        <Skeleton className="mb-8 h-12 w-72" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        {back}
        <DataUnavailable
          what="this corridor"
          onRetry={() => detailQuery.refetch()}
          retrying={detailQuery.isFetching}
        />
      </div>
    );
  }

  const corridor = data.corridor;
  const tone = healthTone(corridor.health_score);

  return (
    <div>
      {back}
      <PageHeader
        eyebrow="Corridor"
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {corridor.source_asset}
            <ArrowRight className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            {corridor.destination_asset}
          </span>
        }
        description={
          <span className="font-mono text-base">
            {issuerOf(sourceKey)} → {issuerOf(destKey)}
          </span>
        }
        actions={
          <Link
            href="/prediction"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:brightness-110"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Check a payment
          </Link>
        }
      />

      {healthAlerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {healthAlerts.slice(0, 3).map((alert, index) => (
            <div key={index} className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              <span className="flex-1">{alert.message}</span>
              <span className="text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Health score" value={corridor.health_score.toFixed(0)} detail={tone.label} tone={tone.text} />
        <Stat
          label="Success rate"
          value={`${corridor.success_rate.toFixed(1)}%`}
          detail={`${corridor.successful_payments.toLocaleString()} of ${corridor.total_attempts.toLocaleString()} settled`}
        />
        <Stat
          label="Payments seen"
          value={corridor.total_attempts.toLocaleString()}
          detail={`${corridor.failed_payments.toLocaleString()} failed`}
        />
        <Stat
          label="Settled volume"
          value={corridor.liquidity_depth_usd > 0 ? usd.format(corridor.liquidity_depth_usd) : "Unpriced"}
          detail="Last 24 hours"
        />
      </div>

      <div className="mb-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SuccessRateChart data={data.historical_success_rate ?? []} />
        <VolumeByHourChart data={data.liquidity_trends ?? []} />
      </div>

      {data.related_corridors && data.related_corridors.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">Related corridors</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.related_corridors.map((related: CorridorMetrics) => {
              const t = healthTone(related.health_score);
              return (
                <Link
                  key={related.id}
                  href={`/corridors/${related.id}`}
                  className="lift rounded-2xl border border-border bg-card p-4 transition-colors hover:border-accent/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground">
                      {related.source_asset} → {related.destination_asset}
                    </h3>
                    <span className={`text-sm font-medium ${t.text}`}>{t.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {related.success_rate.toFixed(1)}% of {related.total_attempts.toLocaleString()} settled
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <p className="mt-10 text-sm text-muted-foreground">
        Measured from mainnet payments over the last 24 hours. Updated {new Date(corridor.last_updated).toLocaleTimeString()}.
      </p>
    </div>
  );
}
