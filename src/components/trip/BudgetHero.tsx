"use client";

import { AlertTriangle } from "lucide-react";
import type { TripAnalytics } from "@/lib/analytics";
import { formatMoney, cn } from "@/lib/format";

/**
 * Banda de presupuesto: gastado, restante y avance.
 * Al superar el límite cambia a rojo y muestra una alerta explícita.
 */
export function BudgetHero({ a }: { a: TripAnalytics }) {
  const pct = Math.min(100, Math.max(0, a.usedPct));
  const hasSpend = a.totalSpent > 0;
  const over = a.remaining < 0;
  const nearLimit = !over && a.usedPct >= 85;

  return (
    <section
      className={cn(
        "rounded-[22px] px-7 py-6 text-white shadow-lg transition-colors",
        over
          ? "bg-gradient-to-r from-[#e05252] to-[#a3232f] shadow-alert-500/25 ring-2 ring-alert-500/40"
          : "brand-gradient shadow-brand-500/20"
      )}
    >
      {over && (
        <p
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-pill bg-white/20 px-3.5 py-1.5 text-[12.5px] font-semibold"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Te pasaste del presupuesto por {formatMoney(Math.abs(a.remaining), a.currency)}
        </p>
      )}

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
        aria-valuenow={Math.round(a.usedPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Presupuesto consumido"
      >
        <div
          className="h-full rounded-full bg-white transition-all duration-700"
          style={{ width: `${hasSpend ? Math.max(pct, 1.5) : 0}%` }}
        />
      </div>

      {nearLimit && (
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium text-white/90">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Vas por el {a.usedPct.toFixed(0)}% del presupuesto
        </p>
      )}
    </section>
  );
}
