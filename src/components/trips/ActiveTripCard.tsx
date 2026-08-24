import Link from "next/link";
import { destinationArt } from "@/lib/destination-art";
import { formatDate, formatMoney, cn } from "@/lib/format";

export type ActiveTrip = {
  id: string;
  destination: string;
  country: string | null;
  budget: number;
  currency: string;
  startDate: string;
  endDate: string;
  spent: number;
  expenseCount: number;
  companions: { id: string; name: string }[];
};

export function ActiveTripCard({ trip }: { trip: ActiveTrip }) {
  const pct = trip.budget > 0 ? Math.min(100, (trip.spent / trip.budget) * 100) : 0;
  const over = trip.spent > trip.budget;
  const start = new Date(trip.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const notStarted = start > today;
  const daysToStart = Math.ceil((start.getTime() - today.getTime()) / 86_400_000);

  return (
    <Link
      href={`/viajes/${trip.id}`}
      className="group block rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
    >
      <div className="relative overflow-hidden rounded-[14px]">
        <div
          className="h-[175px] bg-cream-300 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
          style={{ backgroundImage: destinationArt(trip.destination).dataUri }}
          role="img"
          aria-label={`Ilustracion de ${trip.destination}`}
        />
        <span
          className={cn(
            "absolute left-3 top-3 rounded-pill px-3 py-1 text-[11.5px] font-semibold backdrop-blur",
            notStarted ? "bg-white/90 text-brand-700" : "bg-brand-600/90 text-white"
          )}
        >
          {notStarted ? (daysToStart <= 1 ? "Manana" : `En ${daysToStart} dias`) : "En curso"}
        </span>
      </div>

      <p className="mt-3 text-[14px] font-bold text-ink-900">Viaje a {trip.destination}</p>
      <p className="mt-0.5 text-[13.5px] text-ink-700">
        {formatDate(trip.startDate, { day: "numeric", month: "short" })} –{" "}
        {formatDate(trip.endDate, { day: "numeric", month: "short" })}
      </p>

      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-cream-300">
        <div
          className={cn("h-full rounded-full transition-all duration-500", over ? "bg-alert-500" : "brand-gradient")}
          style={{ width: `${Math.max(pct, trip.spent > 0 ? 2 : 0)}%` }}
        />
      </div>
      <p className={cn("mt-1.5 text-[12.5px]", over ? "text-alert-500" : "text-ink-500")}>
        {formatMoney(trip.spent, trip.currency)} de {formatMoney(trip.budget, trip.currency)}
      </p>
    </Link>
  );
}
