import { destinationArt } from "@/lib/destination-art";

/**
 * Vitrina de viajes pasados incluida en el diseño.
 * El producto ignora los viajes que ya terminaron, así que esta sección es
 * ilustrativa: se muestra atenuada y en escala de grises, y no es navegable.
 */
const PAST_TRIPS = [
  { destination: "Cartagena", range: "1 – 5 ago." },
  { destination: "Madrid", range: "10 – 29 jul." },
  { destination: "Bogotá", range: "12 – 16 ene." },
];

export function PastTripsShowcase() {
  return (
    <section aria-label="Viajes pasados" className="mt-14">
      <h2 className="mb-1 text-[13px] font-semibold text-ink-400">Viajes pasados</h2>
      <p className="mb-4 text-[12.5px] text-ink-400">
        Solo como referencia: los viajes que ya terminaron no se pueden abrir ni editar.
      </p>

      <ul aria-disabled="true" className="grid select-none gap-6 opacity-55 grayscale sm:grid-cols-2 lg:grid-cols-3">
        {PAST_TRIPS.map((trip) => (
          <li key={trip.destination} className="cursor-default">
            <div
              className="h-[175px] rounded-[14px] bg-cream-300 bg-cover bg-center"
              style={{ backgroundImage: destinationArt(trip.destination).dataUri }}
              role="img"
              aria-label={`Ilustración de ${trip.destination}`}
            />
            <p className="mt-3 text-[14px] font-bold text-ink-500">Viaje a {trip.destination}</p>
            <p className="mt-0.5 text-[13.5px] text-ink-400">{trip.range}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
