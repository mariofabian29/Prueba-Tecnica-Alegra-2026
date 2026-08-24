import Link from "next/link";
import { LandingNav } from "./LandingNav";
import { FooterBar } from "@/components/shell/FooterBar";
import { HeroPreview, AssistantPreview, PhonePreview } from "./Previews";

const FEATURES = [
  { title: "Crea tu viaje", detail: "Destino, fechas y presupuesto: asi de simple." },
  { title: "Seguimiento de gastos", detail: "Mira cuanto llevas gastado y cuanto te queda por categoria." },
  { title: "Asistente de IA", detail: "Cuentale que gastaste y lo anota por ti." },
  { title: "Por categorias", detail: "Alojamiento, comida, transporte y mas." },
  { title: "Sube el recibo", detail: "Sube una foto del recibo, sin escribir montos." },
  { title: "Proyeccion", detail: "Anticipate y evita superar tu presupuesto." },
];

const FOOTER_LINKS = [
  ["Viajes", "Blog", "Empleos"],
  ["Asistente IA", "Mis viajes", "Ayuda"],
];

export function Landing({ authenticated }: { authenticated: boolean }) {
  const ctaHref = authenticated ? "/nuevo-viaje" : "/registro";

  return (
    <div className="flex min-h-screen flex-col">
      <LandingNav authenticated={authenticated} />

      <main className="flex-1">
        {/* --------------------------------- Hero -------------------------------- */}
        <section id="inicio" className="relative overflow-hidden bg-cream-50 px-6 py-16 sm:py-20">
          <div
            className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand-100/60 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-32 top-10 h-[440px] w-[440px] rounded-full bg-cream-200/80 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto max-w-[1180px]">
            <h1 className="mx-auto max-w-[720px] text-center text-[38px] font-bold leading-[1.15] tracking-tight text-ink-900 sm:text-[46px]">
              Controla el gasto de tu viaje con ayuda de IA
            </h1>
            <p className="mx-auto mt-4 max-w-[440px] text-center text-[15.5px] leading-relaxed text-ink-700">
              Cuentale a la IA que gastaste y ella registra el monto, la categoria y la fecha por ti.
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                href={ctaHref}
                className="brand-gradient rounded-pill px-8 py-3.5 text-[14.5px] font-bold text-white shadow-lg shadow-brand-500/25 transition-transform hover:scale-[1.02]"
              >
                Comienza a planificar →
              </Link>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              <HeroPreview />
              <AssistantPreview />
            </div>
          </div>
        </section>

        {/* ------------------------------ Funciones ------------------------------ */}
        <section id="funciones" className="bg-cream-200 px-6 py-16">
          <div className="mx-auto max-w-[1180px]">
            <h2 className="text-center text-[27px] font-bold tracking-tight text-ink-900">
              Todo para controlar el presupuesto de tu viaje
            </h2>

            <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title}>
                  <dt className="text-[15px] font-bold text-ink-900">{feature.title}</dt>
                  <dd className="mt-1.5 max-w-[300px] text-[14px] leading-relaxed text-ink-700">
                    {feature.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* --------------------------------- Unete ------------------------------- */}
        <section id="unete" className="bg-cream-50 px-6 py-16">
          <div className="mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-[280px_1fr]">
            <PhonePreview />
            <div>
              <h2 className="text-[27px] font-bold tracking-tight text-ink-900">Unete a Tripflow</h2>
              <p className="mt-2.5 max-w-[400px] text-[15px] leading-relaxed text-ink-700">
                Registra tus gastos, controla tu presupuesto y viaja tranquilo, todo en una sola app.
              </p>
              <Link
                href={ctaHref}
                className="brand-gradient mt-6 inline-block rounded-pill px-8 py-3.5 text-[14.5px] font-bold text-white shadow-lg shadow-brand-500/25 transition-transform hover:scale-[1.02]"
              >
                Comienza a planificar →
              </Link>
            </div>
          </div>
        </section>

        {/* -------------------------------- Footer ------------------------------- */}
        <footer className="bg-cream-200 px-6 py-12">
          <div className="mx-auto flex max-w-[1180px] flex-wrap gap-x-20 gap-y-8">
            <p className="text-[13px] font-bold tracking-wide text-ink-900">TRIPFLOW</p>
            {FOOTER_LINKS.map((column, index) => (
              <ul key={index} className="space-y-2.5">
                {column.map((label) => (
                  <li key={label} className="cursor-default text-[14px] text-ink-700">
                    {label}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </footer>
      </main>

      <FooterBar />
    </div>
  );
}
