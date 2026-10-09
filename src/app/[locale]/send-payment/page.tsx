"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Send } from "lucide-react";

const Sep31PaymentFlow = dynamic(
  () => import("@/components/Sep31PaymentFlow").then((m) => ({ default: m.Sep31PaymentFlow })),
  { ssr: false }
);

export default function SendPaymentPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="text-xs text-accent mb-2">
            SEP-31 // Cross-border
          </div>
          <h2 className="text-4xl font-semibold tracking-tight flex items-center gap-3">
            <Send className="w-8 h-8 text-accent" />
            Send payment
          </h2>
        </div>
        <p className="text-muted-foreground text-sm max-w-md">
          Send cross-border payments through anchors. Recipients can receive fiat. Get quotes, initiate payments, and track status. KYC may be required by the anchor.
        </p>
      </div>

      <Sep31PaymentFlow />
    </div>
  );
}
