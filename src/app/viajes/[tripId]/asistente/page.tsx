import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTripForUser, NotFoundError } from "@/lib/trips";
import { AssistantWorkspace } from "@/components/assistant/AssistantWorkspace";

export const dynamic = "force-dynamic";
export const metadata = { title: "Asistente de IA" };

type Props = { params: Promise<{ tripId: string }> };

export default async function AssistantPage({ params }: Props) {
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

  return (
    <AssistantWorkspace
      userName={session.name}
      tripId={trip.id}
      destination={trip.destination}
      currency={trip.currency}
    />
  );
}
