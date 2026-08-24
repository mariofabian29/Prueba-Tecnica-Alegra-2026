"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { Insight } from "@/lib/ai/insights";
import { useInsights } from "@/hooks/useTrip";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/format";

const TONES: Record<Insight["tone"], { box: string; icon: string; Icon: typeof Lightbulb }> = {
  tip: { box: "border-brand-500/25 bg-brand-500/[0.07]", icon: "text-brand-300", Icon: Lightbulb },
  success: { box: "border-emerald-500/25 bg-emerald-500/[0.07]", icon: "text-emerald-300", Icon: CheckCircle2 },
  warning: { box: "border-amber-500/25 bg-amber-500/[0.07]", icon: "text-amber-300", Icon: AlertTriangle },
  danger: { box: "border-rose-500/25 bg-rose-500/[0.07]", icon: "text-rose-300", Icon: ShieldAlert },
};

const HEALTH_RING: Record<string, string> = {
  on_track: "ring-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "ring-amber-500/30 bg-amber-500/10 text-amber-300",
  over_budget: "ring-rose-500/30 bg-rose-500/10 text-rose-300",
};

export function AiPanel({ tripId }: { tripId: string }) {
  const { insights, isLoading, isValidating, refresh, error } = useInsights(tripId);

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-gradient-to-r from-brand-600/[0.14] to-transparent px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/25 ring-1 ring-brand-500/30">
            <Sparkles className="h-4 w-4 text-brand-200" aria-hidden />
          </span>
          <div>
            <h2 className="text-[14px] font-semibold text-white">Asesor financiero IA</h2>
            <p className="text-[11.5px] text-slate-400">
              {insights
                ? insights.engine === "claude"
                  ? "Analisis generado por Claude"
                  : "Analisis del motor local"
                : "Analizando tu viaje..."}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refresh()}
          disabled={isValidating}
          aria-label="Actualizar analisis"
          className="!px-2"
        >
          <RefreshCw className={cn("h-4 w-4", isValidating && "animate-spin")} aria-hidden />
        </Button>
      </header>

      <div className="card-pad space-y-4">
        {isLoading && !insights ? (
          <SkeletonPanel />
        ) : error && !insights ? (
          <p className="text-[13.5px] text-slate-400">
            No pudimos generar el analisis en este momento. Intenta actualizar en unos segundos.
          </p>
        ) : insights ? (
          <>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-[15.5px] font-bold text-white">{insights.headline}</h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                    HEALTH_RING[insights.health] ?? HEALTH_RING.on_track
                  )}
                >
                  {insights.health === "on_track"
                    ? "En ritmo"
                    : insights.health === "warning"
                      ? "Atencion"
                      : "Excedido"}
                </span>
              </div>
              <p className="text-[13.5px] leading-relaxed text-slate-300">{insights.summary}</p>
            </div>

            <ul className="space-y-2.5">
              {insights.insights.map((insight, index) => {
                const tone = TONES[insight.tone] ?? TONES.tip;
                return (
                  <li
                    key={`${insight.title}-${index}`}
                    className={cn("animate-fade-up rounded-xl border px-3.5 py-3", tone.box)}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex gap-2.5">
                      <tone.Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone.icon)} aria-hidden />
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-white">{insight.title}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-300">{insight.detail}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}

function SkeletonPanel() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando analisis">
      <div className="space-y-2">
        <div className="h-4 w-2/5 animate-pulse-soft rounded bg-white/10" />
        <div className="h-3 w-full animate-pulse-soft rounded bg-white/[0.07]" />
        <div className="h-3 w-4/5 animate-pulse-soft rounded bg-white/[0.07]" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse-soft rounded-xl bg-white/[0.05]" />
      ))}
    </div>
  );
}
