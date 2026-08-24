import { destinationArt } from "@/lib/destination-art";

/**
 * Vitrina de viajes pasados incluida en el diseno.
 * Es puramente ilustrativa: el producto ignora los viajes que ya terminaron,
 * asi que esta seccion no navega ni consulta datos reales.
 */
const PAST_TRIPS = [
  { destination: "Cartagena", range: "1 – 5 ago." },
  { destination: "Madrid", range: "10 – 29 jul." },
  { destination: "Bogota", range: "12 – 16 ene." },
];

export function PastTripsShowcase() {
  return (
    <section aria-label="Viajes pasados" className="mt-14">
      <h2 className="mb-4 text-[13px] font-semibold text-ink-400">Viajes pasados</h2>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PAST_TRIPS.map((trip) => (
          <li key={trip.destination}>
            <div
              className="h-[175px] rounded-[14px] bg-cream-300 bg-cover bg-center"
              style={{ backgroundImage: destinationArt(trip.destination).dataUri }}
              role="img"
              aria-label={`Ilustracion de ${trip.destination}`}
            />
            <p className="mt-3 text-[14px] font-bold text-ink-900">Viaje a {trip.destination}</p>
            <p className="mt-0.5 text-[13.5px] text-ink-700">{trip.range}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
