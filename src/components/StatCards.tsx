"use client";

import { CalendarClock, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import type { TripAnalytics } from "@/lib/analytics";
import { formatMoney, cn } from "@/lib/format";

export function StatCards({ a }: { a: TripAnalytics }) {
  const over = a.remaining < 0;
  const pacing = a.paceDelta;

  const cards = [
    {
      label: "Gastado",
      value: formatMoney(a.totalSpent, a.currency),
      hint: `${a.usedPct.toFixed(0)}% de ${formatMoney(a.budget, a.currency)}`,
      Icon: Wallet,
      accent: "text-brand-300 bg-brand-600/15 ring-brand-500/25",
    },
    {
      label: over ? "Excedido" : "Disponible",
      value: formatMoney(Math.abs(a.remaining), a.currency),
      hint: over ? "Estas por encima del limite" : `${a.daysLeft} dias por delante`,
      Icon: PiggyBank,
      accent: over
        ? "text-rose-300 bg-rose-500/15 ring-rose-500/25"
        : "text-emerald-300 bg-emerald-500/15 ring-emerald-500/25",
    },
    {
      label: "Promedio diario",
      value: formatMoney(a.avgPerDay, a.currency),
      hint:
        pacing === 0
          ? "Justo en el plan"
          : pacing > 0
            ? `${formatMoney(pacing, a.currency)} sobre el plan`
            : `${formatMoney(Math.abs(pacing), a.currency)} bajo el plan`,
      hintTone: pacing > 0 ? "text-amber-300" : pacing < 0 ? "text-emerald-300" : undefined,
      Icon: TrendingUp,
      accent: "text-sky-300 bg-sky-500/15 ring-sky-500/25",
    },
    {
      label: "Puedes gastar por dia",
      value: formatMoney(a.safeDailyBudget, a.currency),
      hint:
        a.daysLeft > 0
          ? `Para los ${a.daysLeft} dias restantes`
          : "El viaje ya finalizo",
      Icon: CalendarClock,
      accent: "text-violet-300 bg-violet-500/15 ring-violet-500/25",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[12px] font-medium uppercase tracking-wide text-slate-400">
              {card.label}
            </span>
            <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg ring-1", card.accent)}>
              <card.Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <p className="mt-2.5 text-[21px] font-bold tracking-tight text-white">{card.value}</p>
          <p className={cn("mt-0.5 text-[12px]", card.hintTone ?? "text-slate-500")}>{card.hint}</p>
        </div>
      ))}
    </div>
  );
}
