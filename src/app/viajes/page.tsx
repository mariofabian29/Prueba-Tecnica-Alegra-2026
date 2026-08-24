import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPinned, Plus, Sparkles } from "lucide-react";
import { getSession } from "@/lib/auth";
import { listActiveTrips } from "@/lib/trips";
import { AppHeader } from "@/components/AppHeader";
import { TripCard } from "@/components/TripCard";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mis viajes · Viajero" };

export default async function TripsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const trips = await listActiveTrips(session.userId);
  const inProgress = trips.filter((t) => new Date(t.startDate) <= new Date());
  const upcoming = trips.filter((t) => new Date(t.startDate) > new Date());

  return (
    <div className="min-h-screen">
      <AppHeader userName={session.name} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">
              Hola, {session.name.split(" ")[0]} 👋
            </h1>
            <p className="mt-1.5 text-[14.5px] text-slate-400">
              {trips.length === 0
                ? "Aun no tienes viajes activos."
                : `Tienes ${trips.length} viaje${trips.length > 1 ? "s" : ""} vigente${trips.length > 1 ? "s" : ""}. Los viajes que ya terminaron no se muestran.`}
            </p>
          </div>
        </div>

        {trips.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            {inProgress.length > 0 && (
              <Section title="En curso" count={inProgress.length}>
                {inProgress.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </Section>
            )}
            {upcoming.length > 0 && (
              <Section title="Proximos" count={upcoming.length}>
                {upcoming.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </Section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
        <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] font-bold text-slate-300">
          {count}
        </span>
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600/15 ring-1 ring-brand-500/25">
        <MapPinned className="h-8 w-8 text-brand-300" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold text-white">Planifica tu primer viaje</h2>
      <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-slate-400">
        Define destino, presupuesto, fechas y acompanantes. Despues registra tus gastos a mano o
        escribiendole al chat, y mira como evoluciona tu presupuesto en tiempo real.
      </p>
      <Link href="/nuevo-viaje" className="mt-6">
        <Button size="lg">
          <Plus className="h-4 w-4" aria-hidden />
          Crear viaje
        </Button>
      </Link>
      <p className="mt-5 flex items-center gap-1.5 text-[12.5px] text-slate-500">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        Incluye panel de recomendaciones con IA
      </p>
    </div>
  );
}
