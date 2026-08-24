"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useTrip, useInsights, revalidateTrips, type TripDTO } from "@/hooks/useTrip";
import type { TripAnalytics } from "@/lib/analytics";
import { DestinationImage } from "@/components/DestinationImage";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { navigateWithFallback } from "@/lib/navigation";
import { BudgetHero } from "./BudgetHero";
import { CategoryDonut } from "./CategoryDonut";
import { BucketCards } from "./BucketCards";
import { ExpenseList } from "./ExpenseList";
import { AiRail } from "./AiRail";
import { AddExpenseModal } from "./AddExpenseModal";
import { AnalysisModal } from "./AnalysisModal";
import { SpendTrend } from "./SpendTrend";

type Props = {
  userName: string;
  initialTrip: TripDTO;
  initialAnalytics: TripAnalytics;
  /** Abre el popup de gasto nada más entrar (?nuevo=1). */
  openExpenseOnMount?: boolean;
};

export function TripDashboard({ userName, initialTrip, initialAnalytics, openExpenseOnMount }: Props) {
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

  async function deleteTrip() {
    if (!confirm(`¿Eliminar el viaje a ${t.destination} y todos sus gastos? Esta accion no se puede deshacer.`)) {
      return;
    }
    setDeleting(true);
    const response = await fetch(`/api/trips/${t.id}`, { method: "DELETE" });
    if (response.ok) {
      await revalidateTrips();
      navigateWithFallback(router.replace, "/viajes");
    } else {
      setDeleting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col xl:flex-row">
      {/* ------------------------------ Presupuesto ----------------------------- */}
      <div className="min-w-0 flex-1 bg-cream-50 px-6 pb-12 pt-6 sm:px-8">
        <div className="relative">
          <DestinationImage
            tripId={t.id}
            destination={t.destination}
            photoUrl={t.photoUrl}
            className="h-[210px] rounded-[20px]"
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
              Añadir gasto
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

      {/* ------------------------------ Análisis IA ----------------------------- */}
      <AiRail a={a} insights={insights} loading={isLoading} onOpenAnalysis={() => setAnalysisOpen(true)} />

      <AddExpenseModal
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        tripId={t.id}
        currency={t.currency}
        people={people}
        companionCount={t.companions.length}
        userName={userName}
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
