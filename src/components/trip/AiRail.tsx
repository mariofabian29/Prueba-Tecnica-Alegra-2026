"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import type { InsightsResult } from "@/lib/ai/insights";
import type { TripAnalytics } from "@/lib/analytics";
import { formatMoney, cn } from "@/lib/format";
import { Button } from "@/components/ui/Button";

const DOT: Record<TripAnalytics["health"], string> = {
  on_track: "bg-[#38c172]",
  warning: "bg-warn-500",
  over_budget: "bg-alert-500",
};

/** Panel lateral de análisis, siempre visible junto al presupuesto. */
export function AiRail({
  a,
  insights,
  loading,
  onOpenAnalysis,
}: {
  a: TripAnalytics;
  insights?: InsightsResult;
  loading: boolean;
  onOpenAnalysis: () => void;
}) {
  const projectedPct = Math.min(100, Math.max(0, a.projectedPct));
  const usedPct = Math.min(100, Math.max(0, a.usedPct));

  return (
    <aside className="w-full shrink-0 bg-cream-100 px-7 py-7 xl:w-[400px]">
      <p className="text-[12px] font-semibold text-ink-400">Análisis de tu viaje · IA</p>

      <h2 className="mt-3 flex items-center gap-2.5 text-[17px] font-bold tracking-tight text-ink-900">
        <span className={cn("h-3 w-3 rounded-full", DOT[a.health])} aria-hidden />
        {loading && !insights ? (
          <span className="h-4 w-28 animate-pulse-soft rounded bg-cream-300" />
        ) : (
          insights?.headline ?? "Analizando"
        )}
      </h2>

      <dl className="mt-4 space-y-2">
        <Row label="Proyección de gasto" value={formatMoney(a.projectedTotal, a.currency)} />
        <Row label="Presupuesto total" value={formatMoney(a.budget, a.currency)} />
      </dl>

      {a.totalSpent > 0 ? (
        <>
          <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-cream-300">
            <div
              className="h-full rounded-full brand-gradient transition-all duration-700"
              style={{ width: `${Math.max(projectedPct, 2)}%` }}
            />
            <span
              className="absolute top-0 h-full w-[3px] rounded-full bg-brand-700"
              style={{ left: `calc(${usedPct}% - 1.5px)` }}
              title="Gasto real a hoy"
              aria-hidden
            />
          </div>
          <p className="mt-2 text-[11.5px] font-medium text-ink-400">
            Proyección: {a.projectedPct.toFixed(0)}% del presupuesto
          </p>
        </>
      ) : (
        <p className="mt-3 text-[11.5px] font-medium text-ink-400">Aún no hay gastos para proyectar</p>
      )}

      <hr className="my-6 border-cream-300" />

      <p className="text-[12px] font-semibold text-ink-400">Insights</p>

      {loading && !insights ? (
        <div className="mt-3 space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 animate-pulse-soft rounded bg-cream-300" />
          ))}
        </div>
      ) : insights && insights.signals.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {insights.signals.map((signal) => (
            <li key={signal.bucket} className="flex items-center justify-between gap-3 text-[14px]">
              <span className="flex items-center gap-2 text-ink-800">
                <span aria-hidden>{signal.emoji}</span>
                {signal.label}
              </span>
              <span
                className={cn(
                  "shrink-0 font-semibold",
                  signal.status === "over"
                    ? "text-alert-500"
                    : signal.status === "under"
                      ? "text-ok-500"
                      : "text-[13px] font-normal text-ink-400"
                )}
              >
                {signal.detail}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[14px] leading-relaxed text-ink-700">
          {insights?.summary ?? "Registra tu primer gasto para ver insights de este viaje."}
        </p>
      )}

      <div className="mt-6 rounded-[14px] border border-brand-300 px-4 py-3.5">
        <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-600">
          <Sparkles className="h-3 w-3" aria-hidden />
          Impulsado por IA
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-800">
          {loading && !insights
            ? "Analizando tus gastos..."
            : (insights?.narrative ??
              "Aún no hay suficientes datos — registra gastos y te avisaremos si algo se desvia del plan.")}
        </p>
      </div>

      <div className="mt-7 flex justify-center">
        <Button onClick={onOpenAnalysis} size="lg">
          Ver análisis
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[14.5px] text-ink-700">{label}</dt>
      <dd className="text-[15px] font-bold text-ink-900">{value}</dd>
    </div>
  );
}
