import React, { useId } from "react";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * PayRaider mark: an R whose leg is an arrow, a payment moving forward
 * through a checkpoint. Same artwork as public/icon.svg.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  // Unique gradient id so several marks on one page don't share a <defs>.
  const gradientId = `pr-mark-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6cf8f" />
          <stop offset="1" stopColor="#c9803f" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill={`url(#${gradientId})`} />
      <path
        d="M16 36V12h9a7 7 0 0 1 0 14h-9M25 26l10 10M28 36h7v-7"
        fill="none"
        stroke="#2c1b10"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  /** Hide the wordmark, e.g. in a collapsed rail. */
  markOnly?: boolean;
  className?: string;
}

export function Logo({ size = 32, markOnly = false, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {!markOnly && (
        <span className="font-display text-[1.35rem] font-semibold leading-none tracking-tight text-foreground">
          Pay<span className="text-accent">Raider</span>
        </span>
      )}
      {markOnly && <span className="sr-only">PayRaider</span>}
    </span>
  );
}
