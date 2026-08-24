"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useTrip, useInsights, type TripDTO } from "@/hooks/useTrip";
import type { TripAnalytics } from "@/lib/analytics";
import { destinationArt } from "@/lib/destination-art";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { BudgetHero } from "./BudgetHero";
import { CategoryDonut } from "./CategoryDonut";
import { BucketCards } from "./BucketCards";
import { ExpenseList } from "./ExpenseList";
import { AiRail } from "./AiRail";
import { AddExpenseModal } from "./AddExpenseModal";
import { AnalysisModal } from "./AnalysisModal";
import { SpendTrend } from "./SpendTrend";

type Props = {
  initialTrip: TripDTO;
  initialAnalytics: TripAnalytics;
  /** Abre el popup de gasto nada mas entrar (?nuevo=1). */
  openExpenseOnMount?: boolean;
};

export function TripDashboard({ initialTrip, initialAnalytics, openExpenseOnMount }: Props) {
  const router = useRouter();
  const { trip, analytics } = useTrip(initialTrip.id, {
    trip: initialTrip,
    analytics: initialAnalytics,
  });
  const { insights, isLoading, isValidating, refresh } = useInsights(initialTrip.id);

  const [expenseOpen, setExpenseOpen] = useState(Boolean(openExpenseOnMount));
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const t = trip ?? initialTrip;
  const a = analytics ?? initialAnalytics;
  const people = ["Yo", ...t.companions.map((c) => c.name)];
  const art = destinationArt(t.destination);

  async function deleteTrip() {
    if (!confirm(`¿Eliminar el viaje a ${t.destination} y todos sus gastos? Esta accion no se puede deshacer.`)) {
      return;
    }
    setDeleting(true);
    const response = await fetch(`/api/trips/${t.id}`, { method: "DELETE" });
    if (response.ok) {
      router.replace("/viajes");
      router.refresh();
    } else {
      setDeleting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col xl:flex-row">
      {/* ------------------------------ Presupuesto ----------------------------- */}
      <div className="min-w-0 flex-1 bg-cream-50 px-6 pb-12 pt-6 sm:px-8">
        <div className="relative">
          <div
            className="h-[210px] rounded-[20px] bg-cream-300 bg-cover bg-center"
            style={{ backgroundImage: art.dataUri }}
            role="img"
            aria-label={`Ilustracion de ${t.destination}`}
          />
          <div className="relative -mt-12 ml-0 mr-8 flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-white px-7 py-5 shadow-sm sm:mr-16">
            <h1 className="text-[24px] font-bold tracking-tight text-ink-900">
              Viaje a {t.destination}
            </h1>
            <span className="text-[13.5px] text-ink-500">
              {formatDate(t.startDate, { day: "numeric", month: "numeric" })} –{" "}
              {formatDate(t.endDate, { day: "numeric", month: "numeric" })}
            </span>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[24px] font-bold tracking-tight text-ink-900">Presupuesto</h2>
          <div className="flex items-center gap-2">
            <Button onClick={() => setExpenseOpen(true)} size="lg">
              <Plus className="h-4 w-4" aria-hidden />
              Anadir gasto
            </Button>
            <Button
              variant="ghost"
              onClick={deleteTrip}
              loading={deleting}
              aria-label="Eliminar viaje"
              className="!px-2.5"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <BudgetHero a={a} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <CategoryDonut a={a} />
          <BucketCards a={a} />
        </div>

        {a.expenseCount > 0 && (
          <div className="mt-5">
            <SpendTrend a={a} />
          </div>
        )}

        <div className="mt-8">
          <ExpenseList tripId={t.id} expenses={t.expenses} currency={t.currency} />
        </div>
      </div>

      {/* ------------------------------ Analisis IA ----------------------------- */}
      <AiRail a={a} insights={insights} loading={isLoading} onOpenAnalysis={() => setAnalysisOpen(true)} />

      <AddExpenseModal
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        tripId={t.id}
        currency={t.currency}
        people={people}
        companionCount={t.companions.length}
      />

      <AnalysisModal
        open={analysisOpen}
        onClose={() => setAnalysisOpen(false)}
        a={a}
        insights={insights}
        loading={isLoading}
        refreshing={isValidating}
        onRefresh={() => refresh()}
      />
    </div>
  );
}
