"use client";

import { Suspense, use, useState } from "react";
import { Check, Copy } from "lucide-react";
import { getAddressValidationError } from "@/lib/address";
import { AssetPortfolio } from "@/components/anchors/AssetPortfolio";
import { ReliabilityTrend } from "@/components/charts/ReliabilityTrend";
import { BackButton } from "@/components/ui/BackButton";
import { DataUnavailable } from "@/components/ui/DataUnavailable";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { useAnchorDetail } from "@/lib/react-query/queries";
import { sanitizeText } from "@/lib/sanitize";
import { AnchorAvatar, formatNumber, HealthBadge } from "../components/helpers";

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

function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Copy account address"
    >
      <span className="truncate">{address}</span>
      {copied ? <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" /> : <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />}
    </button>
  );
}

const back = (
  <BackButton
    fallbackHref="/anchors"
    label="All anchors"
    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
  />
);

function AnchorDetailPageContent({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  // Validate Stellar address (G-address or M-address / muxed) before fetching.
  const validationError = address ? getAddressValidationError(address) : null;
  const query = useAnchorDetail(validationError ? undefined : address);
  const data = query.data;

  if (validationError) {
    return (
      <div>
        {back}
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          {validationError}
        </div>
      </div>
    );
  }

  if (query.isPending) {
    return (
      <div>
        {back}
        <Skeleton className="mb-8 h-16 w-80" />
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
        <DataUnavailable what="this anchor" onRetry={() => query.refetch()} retrying={query.isFetching} />
      </div>
    );
  }

  const anchor = data.anchor;
  const name = sanitizeText(anchor.name) || "Unnamed anchor";
  const successRate =
    anchor.total_transactions > 0
      ? (anchor.successful_transactions / anchor.total_transactions) * 100
      : 0;

  return (
    <div>
      {back}
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        <AnchorAvatar name={anchor.name} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-accent">Anchor</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 text-4xl font-semibold text-foreground md:text-5xl">
            {name}
            <HealthBadge status={anchor.status} />
          </h1>
          <div className="mt-3">
            <CopyAddress address={anchor.stellar_account} />
          </div>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Reliability" value={`${anchor.reliability_score.toFixed(1)}%`} />
        <Stat
          label="Success rate"
          value={`${successRate.toFixed(1)}%`}
          detail={`${formatNumber(anchor.successful_transactions)} of ${formatNumber(anchor.total_transactions)}`}
        />
        <Stat label="Transactions" value={formatNumber(anchor.total_transactions)} />
        <Stat
          label="Failed"
          value={formatNumber(anchor.failed_transactions)}
          tone={anchor.failed_transactions > 0 ? "text-error" : "text-foreground"}
        />
      </div>

      {data.reliability_history.length > 0 && (
        <div className="mb-8">
          <ReliabilityTrend data={data.reliability_history} />
        </div>
      )}

      {data.issued_assets.length > 0 && <AssetPortfolio assets={data.issued_assets} />}
    </div>
  );
}

export default function AnchorDetailPage(props: { params: Promise<{ address: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
      <AnchorDetailPageContent {...props} />
    </Suspense>
  );
}
