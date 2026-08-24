import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTripForUser, NotFoundError, toExpenseLike, toTripLike } from "@/lib/trips";
import { computeAnalytics } from "@/lib/analytics";
import { TripWorkspace } from "@/components/trip/TripWorkspace";
import type { TripDTO } from "@/hooks/useTrip";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ nuevo?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const session = await getSession();
  if (!session) return { title: "Tripflow" };
  const { tripId } = await params;
  try {
    const trip = await getTripForUser(tripId, session.userId);
    return { title: `Viaje a ${trip.destination}` };
  } catch {
    return { title: "Viaje no encontrado" };
  }
}

export default async function TripPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { tripId } = await params;
  const { nuevo } = await searchParams;

  let trip;
  try {
    trip = await getTripForUser(tripId, session.userId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const analytics = computeAnalytics(toTripLike(trip), toExpenseLike(trip.expenses));
  const initialTrip = JSON.parse(JSON.stringify(trip)) as TripDTO;

  return (
    <TripWorkspace
      userName={session.name}
      initialTrip={initialTrip}
      initialAnalytics={analytics}
      openExpenseOnMount={nuevo === "1"}
    />
  );
}
