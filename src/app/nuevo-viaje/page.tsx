import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { NewTripForm } from "@/components/NewTripForm";

export const metadata = { title: "Nuevo viaje · Viajero" };

export default async function NewTripPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen">
      <AppHeader userName={session.name} showNewTrip={false} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <NewTripForm />
      </main>
    </div>
  );
}
