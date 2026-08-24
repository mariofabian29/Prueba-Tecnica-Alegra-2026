"use client";

import type { TripAnalytics } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";

/** Banda con gradiente de marca: gastado, restante y barra de avance. */
export function BudgetHero({ a }: { a: TripAnalytics }) {
  const pct = Math.min(100, Math.max(0, a.usedPct));
  const hasSpend = a.totalSpent > 0;
  const over = a.remaining < 0;

  return (
    <section className="brand-gradient rounded-[22px] px-7 py-6 text-white shadow-lg shadow-brand-500/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-white/80">Gastado</p>
          <p className="mt-0.5 text-[30px] font-bold leading-none tracking-tight">
            {formatMoney(a.totalSpent, a.currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-medium text-white/80">
            {hasSpend ? (over ? "Excedido" : "Restante") : "Presupuesto"}
          </p>
          <p className="mt-0.5 text-[22px] font-bold leading-none tracking-tight">
            {formatMoney(hasSpend ? Math.abs(a.remaining) : a.budget, a.currency)}
          </p>
        </div>
      </div>

      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-white/30"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Presupuesto consumido"
      >
        <div
          className="h-full rounded-full bg-white transition-all duration-700"
          style={{ width: `${hasSpend ? Math.max(pct, 1.5) : 0}%` }}
        />
      </div>
    </section>
  );
}
