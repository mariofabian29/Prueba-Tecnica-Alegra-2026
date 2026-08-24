"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { PastTripsShowcase } from "./PastTripsShowcase";
import { ActiveTripCard, type ActiveTrip } from "./ActiveTripCard";

export function TripsHome({ userName, trips }: { userName: string; trips: ActiveTrip[] }) {
  const router = useRouter();
  const firstTrip = trips[0];

  return (
    <AppShell
      userName={userName}
      active="trips"
      budgetHref={firstTrip ? `/viajes/${firstTrip.id}` : undefined}
      onAssistant={firstTrip ? () => router.push(`/viajes/${firstTrip.id}/asistente`) : undefined}
    >
      <div className="px-8 py-8 sm:px-12 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-[28px] font-bold tracking-tight text-ink-900">
            Vistos recientemente y proximos
          </h1>
          <Link href="/nuevo-viaje">
            <Button size="lg">
              <Plus className="h-4 w-4" aria-hidden />
              Planifica un viaje
            </Button>
          </Link>
        </div>

        {trips.length === 0 ? (
          <p className="mt-5 text-[15px] text-ink-700">
            Aun no has creado nada.{" "}
            <Link href="/nuevo-viaje" className="font-bold text-ink-900 underline underline-offset-2">
              Planifica un nuevo viaje
            </Link>
          </p>
        ) : (
          <ul className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <li key={trip.id}>
                <ActiveTripCard trip={trip} />
              </li>
            ))}
          </ul>
        )}

        <PastTripsShowcase />
      </div>
    </AppShell>
  );
}
