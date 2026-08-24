"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, CalendarDays, Hand, Trash2, Users } from "lucide-react";
import { useTrip, type TripDTO } from "@/hooks/useTrip";
import type { TripAnalytics } from "@/lib/analytics";
import { formatDate, formatMoney, toDateInput, cn } from "@/lib/format";
import { StatCards } from "@/components/StatCards";
import { AiPanel } from "@/components/AiPanel";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ChatBot } from "@/components/ChatBot";
import { ExpenseList } from "@/components/ExpenseList";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { BudgetBurnChart } from "@/components/charts/BudgetBurnChart";
import { DailySpendChart } from "@/components/charts/DailySpendChart";
import { PeopleChart } from "@/components/charts/PeopleChart";
import { Button } from "@/components/ui/Button";

type Props = { initialTrip: TripDTO; initialAnalytics: TripAnalytics };
type Tab = "manual" | "chat";

export function TripDashboard({ initialTrip, initialAnalytics }: Props) {
  const router = useRouter();
  const { trip, analytics } = useTrip(initialTrip.id, {
    trip: initialTrip,
    analytics: initialAnalytics,
  });

  const [tab, setTab] = useState<Tab>("manual");
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
      router.replace("/viajes");
      router.refresh();
    } else {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------- Encabezado ------------------------------ */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/viajes"
            className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Mis viajes
          </Link>

          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-2xl">
              {t.coverEmoji}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[24px] font-bold tracking-tight text-white">
                {t.destination}
                {t.country && <span className="ml-2 text-[16px] font-normal text-slate-400">{t.country}</span>}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  {formatDate(t.startDate)} – {formatDate(t.endDate)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  {t.companions.length === 0
                    ? "Viajas solo"
                    : `Tu + ${t.companions.map((c) => c.name.split(" ")[0]).join(", ")}`}
                </span>
                <StatusPill a={a} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11.5px] uppercase tracking-wider text-slate-500">Presupuesto</p>
            <p className="text-[19px] font-bold text-white">{formatMoney(t.budget, t.currency)}</p>
          </div>
          <Button
            variant="ghost"
            onClick={deleteTrip}
            loading={deleting}
            aria-label="Eliminar viaje"
            className="!px-2.5 text-slate-500 hover:text-rose-300"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      {/* --------------------------------- KPIs --------------------------------- */}
      <StatCards a={a} />

      <ProgressBar a={a} />

      {/* -------------------------- Contenido principal -------------------------- */}
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        {/* Columna izquierda: graficas */}
        <div className="min-w-0 space-y-5">
          <BudgetBurnChart
            data={a.daily}
            currency={t.currency}
            budget={t.budget}
            hasExpenses={a.expenseCount > 0}
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <CategoryDonut data={a.byCategory} currency={t.currency} total={a.totalSpent} />
            <DailySpendChart
              data={a.daily}
              currency={t.currency}
              dailyTarget={a.plannedDailyBudget}
              hasExpenses={a.expenseCount > 0}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <PeopleChart
              data={a.byPerson}
              currency={t.currency}
              groupSize={t.companions.length + 1}
            />
            <ExpenseList tripId={t.id} expenses={t.expenses} currency={t.currency} />
          </div>
        </div>

        {/* Columna derecha: IA siempre visible + registro de gastos */}
        <aside className="min-w-0 space-y-5 xl:sticky xl:top-20 xl:self-start">
          <AiPanel tripId={t.id} />

          <section className="card overflow-hidden">
            <div className="flex border-b border-white/[0.07]" role="tablist" aria-label="Formas de registrar un gasto">
              <TabButton active={tab === "manual"} onClick={() => setTab("manual")} Icon={Hand}>
                Manual
              </TabButton>
              <TabButton active={tab === "chat"} onClick={() => setTab("chat")} Icon={Bot}>
                Chatbot
              </TabButton>
            </div>

            <div className="card-pad">
              {tab === "manual" ? (
                <ExpenseForm
                  tripId={t.id}
                  currency={t.currency}
                  people={people}
                  minDate={toDateInput(t.startDate)}
                  maxDate={toDateInput(t.endDate)}
                />
              ) : (
                <ChatBot tripId={t.id} />
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof Hand;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-[13.5px] font-medium transition-colors",
        active
          ? "border-brand-500 bg-brand-600/[0.08] text-white"
          : "border-transparent text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {children}
    </button>
  );
}

function StatusPill({ a }: { a: TripAnalytics }) {
  const map = {
    NOT_STARTED: { label: "Por comenzar", cls: "bg-brand-500/15 text-brand-300" },
    IN_PROGRESS: { label: `Dia ${a.elapsedDays} de ${a.totalDays}`, cls: "bg-mint-500/15 text-mint-400" },
    FINISHED: { label: "Finalizado", cls: "bg-white/[0.08] text-slate-400" },
  } as const;
  const item = map[a.status];
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", item.cls)}>{item.label}</span>;
}

function ProgressBar({ a }: { a: TripAnalytics }) {
  const pct = Math.min(100, Math.max(0, a.usedPct));
  const idealPct = a.totalDays > 0 ? (a.elapsedDays / a.totalDays) * 100 : 0;
  const over = a.totalSpent > a.budget;

  return (
    <section className="card px-5 py-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
        <span className="font-medium text-slate-300">
          {a.usedPct.toFixed(1)}% del presupuesto consumido
        </span>
        <span className={cn("text-[12.5px]", over ? "text-rose-300" : "text-slate-400")}>
          {over
            ? `Excedido por ${formatMoney(a.totalSpent - a.budget, a.currency)}`
            : `Proyeccion al ritmo actual: ${formatMoney(a.projectedTotal, a.currency)}`}
        </span>
      </div>

      <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            over ? "bg-rose-500" : pct > 85 ? "bg-amber-400" : "bg-gradient-to-r from-brand-500 to-mint-500"
          )}
          style={{ width: `${Math.max(pct, a.totalSpent > 0 ? 1.5 : 0)}%` }}
        />
        {a.status === "IN_PROGRESS" && (
          <span
            className="absolute top-0 h-full w-0.5 bg-white/50"
            style={{ left: `${Math.min(100, idealPct)}%` }}
            title="Donde deberias ir segun el plan"
            aria-hidden
          />
        )}
      </div>

      <p className="mt-1.5 text-[11.5px] text-slate-500">
        La marca blanca indica el avance esperado segun los dias transcurridos.
      </p>
    </section>
  );
}
