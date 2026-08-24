"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { PastTripsShowcase } from "./PastTripsShowcase";
import { ActiveTripCard, type ActiveTrip } from "./ActiveTripCard";

export function TripsHome({ userName, trips: initialTrips }: { userName: string; trips: ActiveTrip[] }) {
  const [trips, setTrips] = useState(initialTrips);

  return (
    // El asistente de IA trabaja siempre sobre un viaje concreto, así que aquí
    // no se ofrece: se activa al entrar en uno.
    <AppShell userName={userName} active="trips">
      <div className="px-6 py-8 sm:px-12 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-[28px] font-bold tracking-tight text-ink-900">Mis viajes</h1>
          <Link href="/nuevo-viaje">
            <Button size="lg">
              <Plus className="h-4 w-4" aria-hidden />
              Planifica un viaje
            </Button>
          </Link>
        </div>

        {trips.length === 0 ? (
          <p className="mt-5 text-[15px] text-ink-700">
            Aún no has creado nada.{" "}
            <Link href="/nuevo-viaje" className="font-bold text-ink-900 underline underline-offset-2">
              Planifica un nuevo viaje
            </Link>
          </p>
        ) : (
          <ul className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <li key={trip.id}>
                <ActiveTripCard
                  trip={trip}
                  onDeleted={(id) => setTrips((list) => list.filter((t) => t.id !== id))}
                />
              </li>
            ))}
          </ul>
        )}

        <PastTripsShowcase />
      </div>
    </AppShell>
  );
}
