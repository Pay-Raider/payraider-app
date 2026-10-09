"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Check,
  CircleHelp,
  Copy,
  OctagonX,
  ShieldCheck,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { logger } from "@/lib/logger";
import { staggerContainer, staggerItem } from "@/components/motion/Reveal";
import {
  checkPayment,
  wilsonInterval,
  type PreflightDecision,
  type PreflightResult,
} from "@/lib/api/api";

const ASSETS = ["USDC", "XLM", "EURC", "PHP", "NGN", "BRL", "KES", "JPY", "GBP", "EUR"];

const DECISIONS: Record<
  PreflightDecision,
  { label: string; hint: string; icon: typeof Check; tone: string; ring: string }
> = {
  proceed: {
    label: "Proceed",
    hint: "The corridor is healthy for this amount.",
    icon: ShieldCheck,
    tone: "text-success bg-success/10",
    ring: "border-success/40",
  },
  caution: {
    label: "Caution",
    hint: "Something is marginal. Pay with care or reroute.",
    icon: AlertTriangle,
    tone: "text-warning bg-warning/10",
    ring: "border-warning/40",
  },
  hold: {
    label: "Hold",
    hint: "A check failed. Don't pay on this corridor now.",
    icon: OctagonX,
    tone: "text-error bg-error/10",
    ring: "border-error/40",
  },
  unknown: {
    label: "Unknown",
    hint: "No recent payments on this corridor, so no guess is made.",
    icon: CircleHelp,
    tone: "text-muted-foreground bg-muted",
    ring: "border-border",
  },
};

const CHECK_LABELS: Record<string, string> = {
  success_rate: "Success rate",
  liquidity: "Liquidity",
  sample_size: "Sample size",
  health_score: "Health score",
};

const STATUS = {
  pass: { icon: Check, tone: "bg-success/15 text-success", label: "Pass" },
  warn: { icon: AlertTriangle, tone: "bg-warning/15 text-warning", label: "Warning" },
  fail: { icon: X, tone: "bg-error/15 text-error", label: "Fail" },
} as const;

const fieldClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]";

function DecisionLegend() {
  return (
    <motion.ul variants={staggerContainer} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2">
      {(Object.keys(DECISIONS) as PreflightDecision[]).map((key) => {
        const d = DECISIONS[key];
        const Icon = d.icon;
        return (
          <motion.li key={key} variants={staggerItem} className="lift flex gap-3 rounded-xl border border-border bg-surface p-4">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${d.tone}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-foreground">{d.label}</p>
              <p className="text-sm text-muted-foreground">{d.hint}</p>
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 font-mono text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Result({ result, requestPath }: { result: PreflightResult; requestPath: string }) {
  const d = DECISIONS[result.decision] ?? DECISIONS.unknown;
  const Icon = d.icon;
  const corridor = result.corridor;
  const [low, high] = corridor
    ? wilsonInterval(corridor.successful_payments, corridor.total_attempts)
    : [0, 0];
  const [copied, setCopied] = useState(false);

  return (
    <motion.div
      className="space-y-6"
      data-testid="preflight-result"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.96, y: 12 },
          show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
        }}
        className={`rounded-2xl border ${d.ring} ${d.tone} p-6`}
      >
        <div className="flex items-center gap-3">
          <motion.span
            initial={{ rotate: -30, scale: 0.5 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.15 }}
          >
            <Icon className="h-7 w-7" aria-hidden="true" />
          </motion.span>
          <p className="font-display text-3xl font-semibold">{d.label}</p>
        </div>
        <p className="mt-3 leading-relaxed text-foreground">{result.summary}</p>
      </motion.div>

      {corridor && (
        <motion.div variants={staggerItem} className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Success rate"
            value={`${corridor.success_rate.toFixed(1)}%`}
            sub={`95%: ${(low * 100).toFixed(1)}–${(high * 100).toFixed(1)}%`}
          />
          <Stat label="Payments observed" value={corridor.total_attempts.toLocaleString()} />
          <Stat label="Health score" value={`${corridor.health_score.toFixed(0)}`} sub="out of 100" />
        </motion.div>
      )}

      {result.checks.length > 0 && (
        <motion.section variants={staggerItem}>
          <h3 className="text-lg font-semibold text-foreground">Checks</h3>
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface">
            {result.checks.map((check) => {
              const s = STATUS[check.status] ?? STATUS.warn;
              const StatusIcon = s.icon;
              return (
                <li key={check.name} className="flex gap-3 p-4">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${s.tone}`}
                    aria-label={s.label}
                  >
                    <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{CHECK_LABELS[check.name] ?? check.name}</p>
                    <p className="text-sm text-muted-foreground">{check.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}

      {result.alternatives.length > 0 && (
        <motion.section variants={staggerItem}>
          <h3 className="text-lg font-semibold text-foreground">Healthier routes</h3>
          <ul className="mt-3 space-y-2">
            {result.alternatives.map((alt) => (
              <li
                key={alt.id}
                className="lift flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
              >
                <span className="font-mono text-sm text-foreground">
                  {alt.source_asset} → {alt.destination_asset}
                </span>
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-success">{alt.success_rate.toFixed(1)}%</span>{" "}
                  success · health {alt.health_score.toFixed(0)}
                </span>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      <motion.div variants={staggerItem} className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3">
        <code className="truncate font-mono text-xs text-muted-foreground">GET {requestPath}</code>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(requestPath).then(() => setCopied(true));
          }}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          {copied ? "Copied" : "Copy"}
        </button>
      </motion.div>
      <motion.p variants={staggerItem} className="text-xs text-muted-foreground">
        Checked {new Date(result.evaluated_at).toLocaleString()} from recent payments on the Stellar ledger.
      </motion.p>
    </motion.div>
  );
}

const PredictionForm = () => {
  const [sourceAsset, setSourceAsset] = useState("USDC");
  const [destAsset, setDestAsset] = useState("NGN");
  const [amount, setAmount] = useState("2500");
  const [result, setResult] = useState<PreflightResult | null>(null);
  const [requestPath, setRequestPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const amountUsd = parseFloat(amount);
    const params = new URLSearchParams({ source_asset: sourceAsset, destination_asset: destAsset });
    if (amountUsd > 0) params.set("amount_usd", String(amountUsd));
    setRequestPath(`/api/v1/preflight?${params}`);

    try {
      setResult(
        await checkPayment({
          source_asset: sourceAsset,
          destination_asset: destAsset,
          amount_usd: amountUsd > 0 ? amountUsd : undefined,
        }),
      );
    } catch (err) {
      setError("Could not reach the PayRaider API to check this corridor. Please try again.");
      logger.error("Pre-payment check failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="max-w-2xl">
        <p className="text-sm font-medium text-accent">Pre-payment check</p>
        <h1 className="mt-2 text-4xl font-semibold text-foreground md:text-5xl">Check a payment</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Name the payment and get one decision, with the reasons, before any money moves.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
        <form
          onSubmit={handleSubmit}
          className="h-fit space-y-5 rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24"
        >
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="space-y-2">
              <label htmlFor="source-asset" className="block text-sm font-medium text-foreground">
                Sending
              </label>
              <select
                id="source-asset"
                value={sourceAsset}
                onChange={(e) => setSourceAsset(e.target.value)}
                className={fieldClass}
              >
                {ASSETS.map((asset) => (
                  <option key={asset} value={asset}>
                    {asset}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setSourceAsset(destAsset);
                setDestAsset(sourceAsset);
              }}
              aria-label="Swap assets"
              className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-accent"
            >
              <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="space-y-2">
              <label htmlFor="dest-asset" className="block text-sm font-medium text-foreground">
                Receiving
              </label>
              <select
                id="dest-asset"
                value={destAsset}
                onChange={(e) => setDestAsset(e.target.value)}
                className={fieldClass}
              >
                {ASSETS.map((asset) => (
                  <option key={asset} value={asset}>
                    {asset}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-medium text-foreground">
              Amount in USD
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${fieldClass} pl-8 font-mono`}
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-xs text-muted-foreground">Leave empty to skip the liquidity check.</p>
          </div>

          <button
            type="submit"
            disabled={loading || sourceAsset === destAsset}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-accent-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Checking…" : "Run check"}
            {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
          {sourceAsset === destAsset && (
            <p className="text-sm text-warning">Choose two different assets.</p>
          )}
          <p className="text-center text-xs text-muted-foreground">Free to use. No sign-up or API key.</p>
        </form>

        <section aria-live="polite" className="min-w-0">
          {loading && (
            <div className="space-y-4" aria-busy="true">
              <div className="h-32 animate-pulse rounded-2xl bg-muted" />
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
              <div className="h-48 animate-pulse rounded-2xl bg-muted" />
            </div>
          )}

          {error && !loading && (
            <div role="alert" className="rounded-2xl border border-error/40 bg-error/10 p-6 text-error">
              {error}
            </div>
          )}

          {result && !loading && <Result result={result} requestPath={requestPath} />}

          {!result && !loading && !error && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Four possible answers</h2>
              <DecisionLegend />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PredictionForm;
