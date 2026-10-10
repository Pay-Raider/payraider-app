import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/layout/PageHeader";

/**
 * Forecasts used to be drawn from a random walk generated in the browser.
 * Real forecasts need weeks of stored corridor history, which the backend
 * does not keep yet (it scores a rolling 24-hour window), so this page says
 * so rather than showing invented predictions.
 */
export default function CorridorForecastingPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Corridors"
        title="Forecasting"
        description="Predicted corridor health is not available yet."
      />
      <div className="max-w-2xl rounded-2xl border border-border bg-card p-6 text-muted-foreground">
        <p>
          Forecasts need weeks of corridor history. PayRaider currently scores corridors from the
          last 24 hours of mainnet payments, which is enough to judge a payment now but not to
          predict next week.
        </p>
        <p className="mt-4">
          For a decision on a payment you are about to make, use{" "}
          <Link href="/prediction" className="font-medium text-accent hover:underline">
            Check a payment
          </Link>
          , or see current scores on the{" "}
          <Link href="/corridors" className="font-medium text-accent hover:underline">
            corridor list
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
