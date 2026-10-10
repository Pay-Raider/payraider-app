"use client";

import { CloudOff, RotateCw } from "lucide-react";

/**
 * Shown when live data could not be loaded. Pages show this instead of
 * substituting sample data, so nothing on screen is ever invented.
 *
 * The free backend plan sleeps when idle and takes up to a minute to wake,
 * which is the usual cause, so the copy says so.
 */
export function DataUnavailable({
  what = "live data",
  onRetry,
  retrying = false,
}: {
  what?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div
      role="status"
      className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        <CloudOff className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-foreground">Couldn&apos;t load {what}</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        The backend may be waking up, which can take up to a minute. Nothing is shown here until
        real network data arrives.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:brightness-110 disabled:opacity-60"
        >
          <RotateCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} aria-hidden="true" />
          {retrying ? "Trying again…" : "Try again"}
        </button>
      )}
    </div>
  );
}
