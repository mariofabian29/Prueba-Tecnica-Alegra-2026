"use client";

import { useEffect } from "react";
import { RouteError } from "@/components/ui/RouteError";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app]", error);
  }, [error]);

  return <RouteError digest={error.digest} onRetry={reset} />;
}
