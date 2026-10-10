"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LiquidityDataPoint, SuccessRateDataPoint } from "@/lib/api/types";
import { getTooltipContentStyle, getTooltipLabelStyle } from "@/lib/chart-utils";

/** "2026-10-10T13:00:00Z" -> "13:00" in the viewer's time zone. */
function hourLabel(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? timestamp
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChartCard({
  title,
  description,
  empty,
  children,
}: {
  title: string;
  description: string;
  empty: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {empty ? (
        <div className="mt-5 flex h-56 items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
          <p className="max-w-xs">{empty}</p>
        </div>
      ) : (
        // Series colours come from currentColor so they follow the theme.
        <div className="mt-5 h-56 text-accent">{children}</div>
      )}
    </section>
  );
}

const axis = { fontSize: 12, fill: "var(--muted-foreground)" };

export function SuccessRateChart({ data }: { data: SuccessRateDataPoint[] }) {
  return (
    <ChartCard
      title="Success rate by hour"
      description="Share of payments through this corridor that settled, each hour over the last 24 hours."
      empty={data.length === 0 ? "No payments through this corridor in the last 24 hours." : null}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="successFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="timestamp" tickFormatter={hourLabel} tick={axis} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={getTooltipContentStyle()}
            labelStyle={getTooltipLabelStyle()}
            labelFormatter={(label) => hourLabel(String(label))}
            formatter={(value, _name, item) => [
              `${Number(value).toFixed(1)}% of ${(item.payload as SuccessRateDataPoint).attempts}`,
              "Settled",
            ]}
          />
          <Area type="monotone" dataKey="success_rate" stroke="currentColor" strokeWidth={2} fill="url(#successFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function VolumeByHourChart({ data }: { data: LiquidityDataPoint[] }) {
  const usd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return (
    <ChartCard
      title="Settled volume by hour"
      description="Dollar value of payments that settled through this corridor, each hour."
      empty={
        data.length === 0
          ? "No dollar price is available for the source asset, so its volume can't be shown in USD."
          : null
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="timestamp" tickFormatter={hourLabel} tick={axis} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tickFormatter={(v) => usd.format(v)} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={getTooltipContentStyle()}
            labelStyle={getTooltipLabelStyle()}
            labelFormatter={(label) => hourLabel(String(label))}
            formatter={(value) => [usd.format(Number(value)), "Settled"]}
          />
          <Area type="monotone" dataKey="volume_24h_usd" stroke="currentColor" strokeWidth={2} fill="url(#volumeFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
