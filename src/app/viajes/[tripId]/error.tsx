"use client";

import { useEffect } from "react";
import { RouteError } from "@/components/ui/RouteError";

export default function TripError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[viaje]", error);
  }, [error]);

  return (
    <RouteError
      title="No pudimos cargar este viaje"
      description="Puede ser un problema temporal. Reintenta o vuelve al listado de tus viajes."
      digest={error.digest}
      onRetry={reset}
    />
  );
}
