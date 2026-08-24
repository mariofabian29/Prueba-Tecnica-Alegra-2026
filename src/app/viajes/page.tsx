import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listActiveTrips } from "@/lib/trips";
import { TripsHome } from "@/components/trips/TripsHome";
import type { ActiveTrip } from "@/components/trips/ActiveTripCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mis viajes" };

export default async function TripsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const trips = await listActiveTrips(session.userId);
  const serialized = JSON.parse(JSON.stringify(trips)) as ActiveTrip[];

  return <TripsHome userName={session.name} trips={serialized} />;
}
