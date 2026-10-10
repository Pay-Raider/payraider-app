import { describe, expect, it } from "vitest";
import { toAnchorDetail } from "@/lib/api/anchor";
import type { AnchorMetrics } from "@/lib/api/types";

const anchor: AnchorMetrics = {
  id: "a1",
  name: "Example",
  stellar_account: "GA",
  reliability_score: 99,
  asset_coverage: 1,
  failure_rate: 1,
  total_transactions: 10,
  successful_transactions: 9,
  failed_transactions: 1,
  status: "green",
};

describe("toAnchorDetail", () => {
  it("wraps the bare anchor record the backend returns", () => {
    expect(toAnchorDetail(anchor)).toEqual({
      anchor,
      issued_assets: [],
      reliability_history: [],
    });
  });

  it("keeps an already wrapped response", () => {
    const wrapped = { anchor, issued_assets: [], reliability_history: [{ timestamp: "t", score: 1 }] };
    expect(toAnchorDetail(wrapped).reliability_history).toHaveLength(1);
  });
});
