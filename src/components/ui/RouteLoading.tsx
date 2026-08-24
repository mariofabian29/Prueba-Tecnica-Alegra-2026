import { Loader } from "@/components/ui/Loader";
import { FooterBar } from "@/components/shell/FooterBar";

/** Pantalla de carga entre rutas, con la barra de marca ya pintada. */
export function RouteLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="brand-gradient h-[72px]" aria-hidden />
      <div className="flex flex-1 items-center justify-center bg-cream-50 px-6">
        <Loader label={label} />
      </div>
      <FooterBar />
    </div>
  );
}
