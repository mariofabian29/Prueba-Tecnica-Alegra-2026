/**
 * Vistas previas de la landing. Reproducen la UI real con datos de ejemplo,
 * sin llamadas a la API, para que la portada cargue al instante.
 */

export function HeroPreview() {
  return (
    <figure className="rounded-[20px] bg-cream-200 p-6">
      <figcaption className="sr-only">Vista previa del dashboard de presupuesto</figcaption>

      <div className="brand-gradient rounded-[16px] px-5 py-4 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-white/80">Gastado</p>
            <p className="mt-0.5 text-[22px] font-bold leading-none">$464.000</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-white/80">Restante</p>
            <p className="mt-0.5 text-[16px] font-bold leading-none">$1.536.000</p>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/30">
          <div className="h-full w-[23%] rounded-full bg-white" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          { label: "Alojamiento", value: "$0", color: "#e94e8f" },
          { label: "Comida", value: "$164.000", color: "#3fa796" },
          { label: "Actividades", value: "$0", color: "#e4b429" },
          { label: "Transporte", value: "$300.000", color: "#2e86ab" },
        ].map((item) => (
          <div key={item.label} className="rounded-[12px] bg-cream-50 px-4 py-3">
            <p className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
              {item.label}
            </p>
            <p className="mt-1 text-[15px] font-bold text-ink-900">{item.value}</p>
          </div>
        ))}
      </div>
    </figure>
  );
}

export function AssistantPreview() {
  return (
    <figure className="flex flex-col justify-center rounded-[20px] bg-cream-200 p-6">
      <figcaption className="sr-only">Vista previa del asistente de IA</figcaption>

      <div className="space-y-3">
        <p className="max-w-[80%] rounded-[14px] bg-cream-50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-900">
          ¡Hola! Cuéntame qué gastaste y lo registro por ti.
        </p>
        <p className="ml-auto max-w-[70%] rounded-[14px] brand-gradient px-4 py-3 text-right text-[13.5px] text-white">
          Gasté 164.000 en una comida
        </p>
        <div className="max-w-[85%] rounded-[14px] border border-brand-300 bg-cream-50 px-4 py-3.5">
          <p className="text-[11.5px] font-semibold text-brand-600">
            Confirma la información y la cargo automáticamente
          </p>
          <dl className="mt-2.5 space-y-1.5 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-ink-700">Monto</dt>
              <dd className="font-bold text-ink-900">$164.000</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-700">Categoría</dt>
              <dd className="text-ink-900">🍴 Comida</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-700">Fecha</dt>
              <dd className="text-ink-900">Hoy</dd>
            </div>
          </dl>
        </div>
      </div>
    </figure>
  );
}

export function PhonePreview() {
  return (
    <figure className="mx-auto w-[240px] rounded-[28px] bg-cream-200 p-4">
      <figcaption className="sr-only">Vista previa de la app en el movil</figcaption>

      <div className="rounded-[20px] bg-cream-50 p-4">
        <div className="brand-gradient rounded-[14px] px-4 py-3 text-white">
          <p className="text-[10px] text-white/80">Gastado</p>
          <p className="text-[18px] font-bold leading-tight">$464.000</p>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/30">
            <div className="h-full w-[23%] rounded-full bg-white" />
          </div>
        </div>

        <ul className="mt-3 space-y-2">
          {[
            { emoji: "✈️", title: "Vuelo Bogotá", amount: "300.000" },
            { emoji: "🍴", title: "Chuzales", amount: "164.000" },
          ].map((item) => (
            <li
              key={item.title}
              className="flex items-center gap-2.5 rounded-[10px] border border-cream-300 bg-white px-3 py-2"
            >
              <span className="text-[13px]" aria-hidden>
                {item.emoji}
              </span>
              <span className="flex-1 truncate text-[11.5px] font-semibold text-ink-900">{item.title}</span>
              <span className="text-[11.5px] font-bold text-ink-900">{item.amount}</span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
