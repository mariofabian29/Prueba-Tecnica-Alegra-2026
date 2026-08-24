"use client";

import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";
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

export function ActiveTripCard({
  trip,
  onDeleted,
}: {
  trip: ActiveTrip;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pct = trip.budget > 0 ? Math.min(100, (trip.spent / trip.budget) * 100) : 0;
  const over = trip.spent > trip.budget;
  const start = new Date(trip.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const notStarted = start > today;
  const daysToStart = Math.ceil((start.getTime() - today.getTime()) / 86_400_000);

  async function remove(event: React.MouseEvent) {
    // La papelera vive dentro del enlace: evitamos abrir el viaje al pulsarla.
    event.preventDefault();
    event.stopPropagation();

    const label = trip.expenseCount > 0 ? ` y sus ${trip.expenseCount} gastos` : "";
    if (!confirm(`¿Eliminar el viaje a ${trip.destination}${label}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "No pudimos eliminar el viaje");
        setDeleting(false);
        return;
      }
      onDeleted(trip.id);
    } catch {
      setError("No pudimos conectar con el servidor");
      setDeleting(false);
    }
  }

  return (
    <div className={cn("transition-opacity", deleting && "pointer-events-none opacity-50")}>
      <Link
        href={`/viajes/${trip.id}`}
        className="group block rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
      >
        <div className="relative overflow-hidden rounded-[14px]">
          <div
            className="h-[175px] bg-cream-300 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
            style={{ backgroundImage: destinationArt(trip.destination).dataUri }}
            role="img"
            aria-label={`Ilustración de ${trip.destination}`}
          />
          <span
            className={cn(
              "absolute left-3 top-3 rounded-pill px-3 py-1 text-[11.5px] font-semibold backdrop-blur",
              notStarted ? "bg-white/90 text-brand-700" : "bg-brand-600/90 text-white"
            )}
          >
            {notStarted ? (daysToStart <= 1 ? "Mañana" : `En ${daysToStart} días`) : "En curso"}
          </span>

          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            aria-label={`Eliminar el viaje a ${trip.destination}`}
            title="Eliminar viaje"
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-ink-500 opacity-0 shadow-sm backdrop-blur transition-all hover:bg-white hover:text-alert-500 focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-60 max-lg:opacity-100"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
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

      {error && <p className="mt-1.5 text-[12.5px] text-alert-500">{error}</p>}
    </div>
  );
}
