"use client";

import { AlertTriangle, CheckCircle2, Lightbulb, RefreshCw, ShieldAlert, Sparkles, X } from "lucide-react";
import type { Insight, InsightsResult } from "@/lib/ai/insights";
import type { TripAnalytics } from "@/lib/analytics";
import { formatMoney, cn } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";

const TONES: Record<Insight["tone"], { box: string; icon: string; Icon: typeof Lightbulb }> = {
  tip: { box: "border-brand-200 bg-brand-50", icon: "text-brand-600", Icon: Lightbulb },
  success: { box: "border-ok-500/25 bg-ok-500/[0.07]", icon: "text-ok-600", Icon: CheckCircle2 },
  warning: { box: "border-warn-500/30 bg-warn-500/[0.09]", icon: "text-warn-600", Icon: AlertTriangle },
  danger: { box: "border-alert-500/25 bg-alert-500/[0.07]", icon: "text-alert-600", Icon: ShieldAlert },
};

/** Análisis completo del viaje: se abre desde "Ver análisis" del panel lateral. */
export function AnalysisModal({
  open,
  onClose,
  a,
  insights,
  loading,
  refreshing,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  a: TripAnalytics;
  insights?: InsightsResult;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="analysis-title" className="max-w-[600px]">
      <header className="relative mb-5 flex items-center justify-center">
        <h2 id="analysis-title" className="text-[19px] font-bold tracking-tight text-ink-900">
          Análisis de tu viaje
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-0 rounded-lg p-1 text-ink-500 transition-colors hover:text-ink-900"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {loading && !insights ? (
        <div className="py-10">
          <Loader label="Analizando tus gastos..." size="sm" />
        </div>
      ) : insights ? (
        <div className="space-y-5">
          <div>
            <h3 className="text-[17px] font-bold text-ink-900">{insights.headline}</h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-700">{insights.summary}</p>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <Metric label="Promedio diario" value={formatMoney(a.avgPerDay, a.currency)} />
            <Metric label="Puedes gastar por día" value={formatMoney(a.safeDailyBudget, a.currency)} />
            <Metric label="Proyección del viaje" value={formatMoney(a.projectedTotal, a.currency)} />
            <Metric
              label={a.projectedOverrun > 0 ? "Sobrecosto proyectado" : "Margen proyectado"}
              value={formatMoney(
                a.projectedOverrun > 0 ? a.projectedOverrun : Math.max(0, a.budget - a.projectedTotal),
                a.currency
              )}
              tone={a.projectedOverrun > 0 ? "alert" : "ok"}
            />
          </dl>

          <ul className="space-y-2.5">
            {insights.insights.map((insight, index) => {
              const tone = TONES[insight.tone] ?? TONES.tip;
              return (
                <li
                  key={`${insight.title}-${index}`}
                  className={cn("animate-fade-up rounded-[14px] border px-4 py-3.5", tone.box)}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex gap-3">
                    <tone.Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone.icon)} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-ink-900">{insight.title}</p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-ink-700">{insight.detail}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <footer className="flex items-center justify-between gap-3 border-t border-cream-300 pt-4">
            <p className="flex items-center gap-1.5 text-[12px] text-ink-400">
              <Sparkles className="h-3 w-3" aria-hidden />
              {insights.engine === "claude"
                ? "Generado por Claude"
                : "Generado por el motor de análisis local"}
            </p>
            <Button variant="outline" size="sm" onClick={onRefresh} loading={refreshing}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Actualizar
            </Button>
          </footer>
        </div>
      ) : (
        <p className="py-6 text-center text-[14px] text-ink-500">
          No pudimos generar el análisis. Intenta de nuevo en unos segundos.
        </p>
      )}
    </Modal>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "alert";
}) {
  return (
    <div className="rounded-[14px] bg-cream-200 px-4 py-3">
      <dt className="text-[12px] text-ink-500">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 text-[16px] font-bold",
          tone === "alert" ? "text-alert-600" : tone === "ok" ? "text-ok-600" : "text-ink-900"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
