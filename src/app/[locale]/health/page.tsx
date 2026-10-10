"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import { api, API_BASE_URL } from "@/lib/api/api";
import { useCorridors } from "@/lib/react-query/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataUnavailable } from "@/components/ui/DataUnavailable";
import { Skeleton } from "@/components/ui/Skeleton";
import { Link } from "@/i18n/navigation";

interface ComponentHealth {
  healthy: boolean;
  response_time_ms: number | null;
  message: string | null;
}

interface ServiceHealth {
  status: "healthy" | "degraded" | "unhealthy";
  uptimeSeconds: number;
  checks: { database: ComponentHealth; cache: ComponentHealth; rpc: ComponentHealth };
  network: { display_name: string };
}

interface LatestLedger {
  sequence: number;
  closed_at: string;
  transaction_count: number;
  operation_count: number;
  protocol_version: number;
  base_fee: number;
}

interface RpcHealth {
  status: string;
  latestLedger: number;
  oldestLedger: number;
  ledgerRetentionWindow: number;
}

const REFRESH_MS = 15_000;

function useServiceHealth() {
  return useQuery({
    queryKey: ["service-health"],
    queryFn: async (): Promise<ServiceHealth> => {
      // /health sits at the backend root, outside the /api prefix.
      const res = await fetch(`${API_BASE_URL.replace(/\/api\/?$/, "")}/health`);
      if (!res.ok) throw new Error(`Health check failed (${res.status})`);
      return res.json();
    },
    refetchInterval: REFRESH_MS,
  });
}

const STATUS = {
  healthy: { icon: CheckCircle2, text: "text-success", label: "Operational" },
  degraded: { icon: CircleAlert, text: "text-warning", label: "Degraded" },
  unhealthy: { icon: XCircle, text: "text-error", label: "Down" },
} as const;

function ago(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  return seconds < 60 ? `${seconds}s ago` : `${Math.round(seconds / 60)} min ago`;
}

function uptime(seconds: number) {
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} h`;
  return `${Math.floor(seconds / 86_400)} d`;
}

function Check({ name, detail, health }: { name: string; detail: string; health?: ComponentHealth }) {
  const s = !health ? null : health.healthy ? STATUS.healthy : name === "Cache" ? STATUS.degraded : STATUS.unhealthy;
  const Icon = s?.icon;
  return (
    <li className="flex items-start gap-3 py-3">
      {Icon ? <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.text}`} aria-hidden="true" /> : <Skeleton className="h-5 w-5 rounded-full" />}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground">{health?.message ?? detail}</p>
      </div>
      {health?.response_time_ms != null && (
        <span className="text-sm tabular-nums text-muted-foreground">{health.response_time_ms} ms</span>
      )}
    </li>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
      {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
    </div>
  );
}

export default function HealthPage() {
  const service = useServiceHealth();
  const ledger = useQuery({
    queryKey: ["ledger-latest"],
    queryFn: () => api.get<LatestLedger>("/rpc/ledger/latest"),
    refetchInterval: REFRESH_MS,
  });
  const rpc = useQuery({
    queryKey: ["rpc-health"],
    queryFn: () => api.get<RpcHealth>("/rpc/health"),
    refetchInterval: REFRESH_MS,
  });
  const corridors = useCorridors({ sort_by: "health_score", limit: 200 });

  const status = service.data ? STATUS[service.data.status] : null;
  const list = corridors.data?.data ?? [];
  const buckets = [
    { label: "Healthy", count: list.filter((c) => c.health_score >= 80).length, tone: "bg-success" },
    { label: "Caution", count: list.filter((c) => c.health_score >= 50 && c.health_score < 80).length, tone: "bg-warning" },
    { label: "Poor", count: list.filter((c) => c.health_score < 50).length, tone: "bg-error" },
  ];

  if (service.isError && ledger.isError) {
    return (
      <div>
        <PageHeader eyebrow="Network data" title="Network health" />
        <DataUnavailable
          what="network status"
          onRetry={() => {
            service.refetch();
            ledger.refetch();
          }}
          retrying={service.isFetching}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Network data"
        title="Network health"
        description="Live status of the Stellar network and of the PayRaider service that scores it. Refreshes every 15 seconds."
        actions={
          status && (
            <span className={`inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium ${status.text}`}>
              <status.icon className="h-4 w-4" aria-hidden="true" />
              {status.label}
            </span>
          )
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Latest ledger"
          value={ledger.data ? ledger.data.sequence.toLocaleString() : "—"}
          detail={ledger.data ? `Closed ${ago(ledger.data.closed_at)}` : undefined}
        />
        <Stat
          label="Transactions in ledger"
          value={ledger.data ? ledger.data.transaction_count.toLocaleString() : "—"}
          detail={ledger.data ? `${ledger.data.operation_count.toLocaleString()} operations` : undefined}
        />
        <Stat
          label="Protocol"
          value={ledger.data ? String(ledger.data.protocol_version) : "—"}
          detail={ledger.data ? `Base fee ${ledger.data.base_fee} stroops` : undefined}
        />
        <Stat
          label="RPC history"
          value={rpc.data ? `${Math.round(rpc.data.ledgerRetentionWindow / 17_280)} days` : "—"}
          detail={rpc.data ? `From ledger ${rpc.data.oldestLedger.toLocaleString()}` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <h2 className="text-lg font-semibold text-foreground">Service checks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {service.data
              ? `${service.data.network.display_name} · up ${uptime(service.data.uptimeSeconds)}`
              : "Checking…"}
          </p>
          <ul className="mt-3 divide-y divide-border">
            <Check name="Stellar RPC" detail="Soroban RPC and Horizon" health={service.data?.checks.rpc} />
            <Check name="Database" detail="Anchors, keys and alerts" health={service.data?.checks.database} />
            <Check name="Cache" detail="Redis" health={service.data?.checks.cache} />
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <h2 className="text-lg font-semibold text-foreground">Corridor health</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {corridors.data ? `${list.length} corridors seen in the last 24 hours` : "Loading corridors…"}
          </p>
          {list.length > 0 && (
            <>
              <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-muted">
                {buckets.map((b) =>
                  b.count > 0 ? (
                    <div key={b.label} className={b.tone} style={{ width: `${(b.count / list.length) * 100}%` }} />
                  ) : null,
                )}
              </div>
              <ul className="mt-4 space-y-2">
                {buckets.map((b) => (
                  <li key={b.label} className="flex items-center gap-3 text-sm">
                    <span className={`h-2.5 w-2.5 rounded-full ${b.tone}`} aria-hidden="true" />
                    <span className="text-foreground">{b.label}</span>
                    <span className="ml-auto tabular-nums text-muted-foreground">{b.count}</span>
                  </li>
                ))}
              </ul>
              <Link href="/corridors" className="mt-5 inline-block text-sm font-medium text-accent hover:underline">
                See all corridors →
              </Link>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
