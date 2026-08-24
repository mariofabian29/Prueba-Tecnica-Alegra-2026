"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { TripDashboard } from "./TripDashboard";
import type { TripDTO } from "@/hooks/useTrip";
import type { TripAnalytics } from "@/lib/analytics";

/**
 * Une el shell privado con el dashboard para que el botón "Asistente IA"
 * del sidebar pueda llevar al chat de este viaje.
 */
export function TripWorkspace({
  userName,
  initialTrip,
  initialAnalytics,
  openExpenseOnMount,
}: {
  userName: string;
  initialTrip: TripDTO;
  initialAnalytics: TripAnalytics;
  openExpenseOnMount?: boolean;
}) {
  const router = useRouter();

  return (
    <AppShell
      userName={userName}
      active="budget"
      activeTripId={initialTrip.id}
      onAssistant={() => router.push(`/viajes/${initialTrip.id}/asistente`)}
    >
      <TripDashboard
        userName={userName}
        initialTrip={initialTrip}
        initialAnalytics={initialAnalytics}
        openExpenseOnMount={openExpenseOnMount}
      />
    </AppShell>
  );
}
