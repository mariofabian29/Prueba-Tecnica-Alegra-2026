"use client";

import type { TripAnalytics } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";

/** Las 4 tarjetas de resumen por grupo de gasto. */
export function BucketCards({ a }: { a: TripAnalytics }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {a.byBucket.map((bucket) => (
        <div key={bucket.bucket} className="rounded-[18px] bg-cream-200 px-5 py-4">
          <p className="flex items-center gap-2 text-[13px] font-medium text-ink-500">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: bucket.total > 0 ? bucket.color : "#c9bfb6" }}
              aria-hidden
            />
            {bucket.label}
          </p>
          <p className="mt-1.5 text-[20px] font-bold tracking-tight text-ink-900">
            {formatMoney(bucket.total, a.currency)}
          </p>
        </div>
      ))}
    </div>
  );
}
