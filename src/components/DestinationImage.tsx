"use client";

import { useEffect, useState } from "react";
import { destinationArt } from "@/lib/destination-art";
import { cn } from "@/lib/format";

type Props = {
  tripId?: string;
  destination: string;
  photoUrl?: string | null;
  className?: string;
  /** Texto alternativo; por defecto describe el destino. */
  alt?: string;
  /** Si es false, no se intenta resolver la foto (vitrinas ilustrativas). */
  resolve?: boolean;
};

/**
 * Imagen de un destino.
 *
 * De fondo va siempre la ilustración generada, así que nunca hay un hueco en
 * blanco. Encima se superpone la foto real cuando existe; si el viaje aún no
 * tiene ninguna, se pide una vez al servidor y aparece al llegar.
 */
export function DestinationImage({
  tripId,
  destination,
  photoUrl,
  className,
  alt,
  resolve = true,
}: Props) {
  const art = destinationArt(destination);
  const [src, setSrc] = useState<string | null>(photoUrl ?? null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSrc(photoUrl ?? null);
    setLoaded(false);
  }, [photoUrl]);

  useEffect(() => {
    if (!resolve || src || !tripId) return;

    let cancelled = false;
    fetch(`/api/trips/${tripId}/photo`, { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.photoUrl) setSrc(data.photoUrl);
      })
      .catch(() => {
        // Sin foto disponible: se queda la ilustración generada.
      });

    return () => {
      cancelled = true;
    };
  }, [resolve, src, tripId]);

  return (
    <div
      className={cn("relative overflow-hidden bg-cream-300 bg-cover bg-center", className)}
      style={{ backgroundImage: art.dataUri }}
      role={src ? undefined : "img"}
      aria-label={src ? undefined : `Ilustración de ${destination}`}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? `Foto de ${destination}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setSrc(null)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
}
