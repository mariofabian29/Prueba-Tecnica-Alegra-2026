import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600/15 ring-1 ring-brand-500/25">
        <Compass className="h-8 w-8 text-brand-300" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold text-white">Pagina no encontrada</h1>
      <p className="mt-2 max-w-sm text-[14.5px] text-slate-400">
        El viaje que buscas no existe, ya termino o no te pertenece.
      </p>
      <Link href="/viajes" className="mt-6">
        <Button size="lg">Volver a mis viajes</Button>
      </Link>
    </main>
  );
}
