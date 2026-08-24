"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FooterBar } from "@/components/shell/FooterBar";

/** Pantalla de error de ruta: explica qué pasó y ofrece cómo continuar. */
export function RouteError({
  title = "Algo salió mal",
  description = "No pudimos cargar esta pantalla. Vuelve a intentarlo en unos segundos.",
  digest,
  onRetry,
}: {
  title?: string;
  description?: string;
  digest?: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="brand-gradient h-[72px]" aria-hidden />
      <main className="flex flex-1 flex-col items-center justify-center bg-cream-50 px-6 text-center">
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-alert-500/10">
          <AlertTriangle className="h-6 w-6 text-alert-500" aria-hidden />
        </span>
        <h1 className="text-[24px] font-bold tracking-tight text-ink-900">{title}</h1>
        <p className="mt-2.5 max-w-[420px] text-[15px] leading-relaxed text-ink-700">{description}</p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Reintentar
          </Button>
          <Link href="/viajes">
            <Button size="lg" variant="outline">
              Ir a mis viajes
            </Button>
          </Link>
        </div>

        {digest && (
          <p className="mt-6 font-mono text-[11.5px] text-ink-400">Referencia del error: {digest}</p>
        )}
      </main>
      <FooterBar />
    </div>
  );
}
