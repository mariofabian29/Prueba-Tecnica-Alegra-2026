import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTripForUser, NotFoundError, toExpenseLike, toTripLike } from "@/lib/trips";
import { computeAnalytics } from "@/lib/analytics";
import { AppHeader } from "@/components/AppHeader";
import { TripDashboard } from "@/components/TripDashboard";
import type { TripDTO } from "@/hooks/useTrip";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ tripId: string }> };

export async function generateMetadata({ params }: Props) {
  const session = await getSession();
  if (!session) return { title: "Viajero" };
  const { tripId } = await params;
  try {
    const trip = await getTripForUser(tripId, session.userId);
    return { title: `${trip.destination} · Viajero` };
  } catch {
    return { title: "Viaje no encontrado · Viajero" };
  }
}

export default async function TripPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { tripId } = await params;

  let trip;
  try {
    trip = await getTripForUser(tripId, session.userId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const analytics = computeAnalytics(toTripLike(trip), toExpenseLike(trip.expenses));

  // Se serializa a JSON para pasar del server component al client component.
  const initialTrip = JSON.parse(JSON.stringify(trip)) as TripDTO;

  return (
    <div className="min-h-screen">
      <AppHeader userName={session.name} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <TripDashboard initialTrip={initialTrip} initialAnalytics={analytics} />
      </main>
    </div>
  );
}
