"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, X } from "lucide-react";
import { CURRENCIES, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Loader } from "@/components/ui/Loader";
import { DateRangePicker } from "./DateRangePicker";

type Companion = { key: string; name: string; email: string };

export function NewTripForm() {
  const router = useRouter();

  const [destination, setDestination] = useState("");
  const [range, setRange] = useState({ start: "", end: "" });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("COP");
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [showCompanions, setShowCompanions] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function addCompanion() {
    setShowCompanions(true);
    setCompanions((c) => [...c, { key: crypto.randomUUID(), name: "", email: "" }]);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFields({});

    const amount = Number(budget.replace(/[^\d.,-]/g, "").replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Ingresa un presupuesto mayor a 0.");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destination.trim(),
          budget: amount,
          currency,
          startDate: range.start,
          endDate: range.end || range.start,
          companions: companions
            .filter((c) => c.name.trim())
            .map((c) => ({ name: c.name.trim(), email: c.email.trim() })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No pudimos crear el viaje");
        setFields(data.fields ?? {});
        setCreating(false);
        return;
      }

      router.replace(`/viajes/${data.trip.id}`);
      router.refresh();
    } catch {
      setError("No pudimos conectar con el servidor.");
      setCreating(false);
    }
  }

  if (creating) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader label="Creando tu viaje..." />
      </div>
    );
  }

  const rangeLabel = (iso: string, fallback: string) =>
    iso ? formatDate(`${iso}T12:00:00`, { day: "numeric", month: "long" }) : fallback;

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-[380px] animate-fade-up pb-16 pt-10">
      <h1 className="mb-6 text-center text-[26px] font-bold tracking-tight text-ink-900">
        Planifica un nuevo viaje
      </h1>

      {error && <Alert tone="error" className="mb-4">{error}</Alert>}

      {/* -------------------------------- Destino ------------------------------- */}
      <label htmlFor="destination" className="mb-1.5 block text-[13px] font-semibold text-brand-700">
        ¿A donde?
      </label>
      <input
        id="destination"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="p. ej. Paris, Hawai, Japon"
        maxLength={80}
        required
        className="input-base"
      />
      {fields.destination && <p className="mt-1 text-[12.5px] text-alert-500">{fields.destination}</p>}

      {/* -------------------------------- Fechas -------------------------------- */}
      <p className="mb-1.5 mt-4 text-[13px] font-semibold text-brand-700">Fechas (opcional)</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setCalendarOpen((v) => !v)}
          aria-expanded={calendarOpen}
          className="input-base text-left"
        >
          <span className={range.start ? "text-ink-900" : "text-ink-400"}>
            {rangeLabel(range.start, "Fecha de inicio")}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setCalendarOpen((v) => !v)}
          aria-expanded={calendarOpen}
          className="input-base text-left"
        >
          <span className={range.end ? "text-ink-900" : "text-ink-400"}>
            {rangeLabel(range.end, "Fecha final")}
          </span>
        </button>
      </div>
      {fields.endDate && <p className="mt-1 text-[12.5px] text-alert-500">{fields.endDate}</p>}

      {calendarOpen && (
        <div className="mt-3">
          <DateRangePicker
            start={range.start}
            end={range.end}
            onChange={(next) => {
              setRange(next);
              if (next.start && next.end) setCalendarOpen(false);
            }}
          />
        </div>
      )}

      {/* ----------------------------- Presupuesto ------------------------------ */}
      <label htmlFor="budget" className="mb-1.5 mt-4 block text-[13px] font-semibold text-brand-700">
        Presupuesto
      </label>
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <input
          id="budget"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          inputMode="decimal"
          placeholder="$ 0.0000"
          required
          className="input-base"
        />
        <div className="relative">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            aria-label="Moneda del viaje"
            className="input-base cursor-pointer appearance-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      {fields.budget && <p className="mt-1 text-[12.5px] text-alert-500">{fields.budget}</p>}

      {/* ---------------------------- Acompanantes ------------------------------ */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={addCompanion}
          className="flex items-center gap-1 text-[14px] text-ink-800 transition-colors hover:text-brand-600"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Invita a companeros de viaje
        </button>
        <span
          className="flex cursor-default items-center gap-1 text-[13.5px] font-semibold text-brand-700"
          title="La libreta de amigos hace parte del diseno y aun no esta implementada"
        >
          Amigos
          <ChevronDown className="h-3 w-3" aria-hidden />
        </span>
      </div>

      {showCompanions && companions.length > 0 && (
        <ul className="mt-3 space-y-2.5">
          {companions.map((companion, index) => (
            <li key={companion.key} className="flex items-center gap-2">
              <input
                value={companion.name}
                onChange={(e) =>
                  setCompanions((list) =>
                    list.map((c) => (c.key === companion.key ? { ...c, name: e.target.value } : c))
                  )
                }
                placeholder="Nombre"
                aria-label={`Nombre del acompanante ${index + 1}`}
                className="input-base !py-2.5"
              />
              <input
                value={companion.email}
                onChange={(e) =>
                  setCompanions((list) =>
                    list.map((c) => (c.key === companion.key ? { ...c, email: e.target.value } : c))
                  )
                }
                type="email"
                placeholder="Correo (opcional)"
                aria-label={`Correo del acompanante ${index + 1}`}
                className="input-base !py-2.5"
              />
              <button
                type="button"
                onClick={() => setCompanions((list) => list.filter((c) => c.key !== companion.key))}
                aria-label={`Quitar acompanante ${index + 1}`}
                className="shrink-0 rounded-lg p-2 text-ink-400 transition-colors hover:text-alert-500"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* --------------------------------- Envio -------------------------------- */}
      <div className="mt-7 flex justify-center">
        <Button type="submit" size="lg" className="min-w-[200px]">
          Comienza a planificar
        </Button>
      </div>

      <p
        className="mt-4 cursor-default text-center text-[14px] text-ink-500"
        title="Las guias de viaje hacen parte del diseno y aun no estan implementadas"
      >
        O escribe una nueva guia
      </p>
    </form>
  );
}
