import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TopNav } from "@/components/shell/TopNav";
import { FooterBar } from "@/components/shell/FooterBar";
import { NewTripForm } from "@/components/trips/NewTripForm";

export const metadata = { title: "Planifica un nuevo viaje" };

export default async function NewTripPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav userName={session.name} />
      <main className="flex-1 bg-cream-50 px-4">
        <NewTripForm />
      </main>
      <FooterBar />
    </div>
  );
}
