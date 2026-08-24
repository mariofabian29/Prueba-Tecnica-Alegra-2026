import Link from "next/link";
import { FooterBar } from "@/components/shell/FooterBar";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="brand-gradient h-[72px]" aria-hidden />
      <main className="flex flex-1 flex-col items-center justify-center bg-cream-50 px-4 text-center">
        <h1 className="text-[26px] font-bold tracking-tight text-ink-900">Pagina no encontrada</h1>
        <p className="mt-2.5 max-w-[380px] text-[15px] leading-relaxed text-ink-700">
          El viaje que buscas no existe, ya termino o no te pertenece.
        </p>
        <Link href="/viajes" className="mt-7">
          <Button size="lg">Volver a mis viajes</Button>
        </Link>
      </main>
      <FooterBar />
    </div>
  );
}
