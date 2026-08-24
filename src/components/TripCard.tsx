import Link from "next/link";
import { ArrowRight, CalendarDays, Users } from "lucide-react";
import { formatDate, formatMoney, cn } from "@/lib/format";

export type TripCardData = {
  id: string;
  destination: string;
  country: string | null;
  budget: number;
  currency: string;
  startDate: Date | string;
  endDate: Date | string;
  coverEmoji: string;
  spent: number;
  expenseCount: number;
  companions: { id: string; name: string }[];
};

export function TripCard({ trip }: { trip: TripCardData }) {
  const pct = trip.budget > 0 ? Math.min(100, (trip.spent / trip.budget) * 100) : 0;
  const over = trip.spent > trip.budget;
  const start = new Date(trip.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const notStarted = start > today;
  const daysToStart = Math.ceil((start.getTime() - today.getTime()) / 86_400_000);

  const barColor = over ? "bg-rose-500" : pct > 80 ? "bg-amber-400" : "bg-mint-500";

  return (
    <Link
      href={`/viajes/${trip.id}`}
      className="card group block p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-950/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-2xl">
            {trip.coverEmoji}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-white">{trip.destination}</h3>
            {trip.country && <p className="truncate text-[13px] text-slate-400">{trip.country}</p>}
          </div>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            notStarted
              ? "bg-brand-500/15 text-brand-300"
              : "bg-mint-500/15 text-mint-400"
          )}
        >
          {notStarted ? (daysToStart === 1 ? "Manana" : `En ${daysToStart} dias`) : "En curso"}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="font-semibold text-white">{formatMoney(trip.spent, trip.currency)}</span>
          <span className="text-slate-400">de {formatMoney(trip.budget, trip.currency)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${Math.max(pct, trip.spent > 0 ? 2 : 0)}%` }}
          />
        </div>
        <p className={cn("text-[12px]", over ? "text-rose-300" : "text-slate-400")}>
          {over
            ? `Excedido por ${formatMoney(trip.spent - trip.budget, trip.currency)}`
            : `Disponible ${formatMoney(trip.budget - trip.spent, trip.currency)}`}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3.5 text-[12px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          {formatDate(trip.startDate, { day: "2-digit", month: "short" })} –{" "}
          {formatDate(trip.endDate, { day: "2-digit", month: "short" })}
        </span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {trip.companions.length + 1}
          </span>
          <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-300" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
