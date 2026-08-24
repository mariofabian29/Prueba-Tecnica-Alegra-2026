"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { CURRENCIES, toDateInput } from "@/lib/format";

const EMOJIS = ["🌍", "🏝️", "🏔️", "🏙️", "🎒", "✈️", "🚗", "⛩️", "🗽", "🇵🇹", "🇨🇴", "🇲🇽", "🇪🇸", "🇯🇵"];

type Companion = { key: string; name: string; email: string };

function todayInput() {
  return toDateInput(new Date());
}

function plusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateInput(d);
}

export function NewTripForm() {
  const router = useRouter();

  const [values, setValues] = useState({
    destination: "",
    country: "",
    budget: "",
    currency: "USD",
    startDate: todayInput(),
    endDate: plusDays(6),
    notes: "",
    coverEmoji: "🌍",
  });
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set =
    (key: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  function addCompanion() {
    setCompanions((c) => [...c, { key: crypto.randomUUID(), name: "", email: "" }]);
  }

  function updateCompanion(key: string, patch: Partial<Companion>) {
    setCompanions((c) => c.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function removeCompanion(key: string) {
    setCompanions((c) => c.filter((item) => item.key !== key));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFields({});

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          budget: Number(values.budget),
          companions: companions
            .filter((c) => c.name.trim())
            .map((c) => ({ name: c.name.trim(), email: c.email.trim() })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No pudimos crear el viaje");
        setFields(data.fields ?? {});
        return;
      }

      router.replace(`/viajes/${data.trip.id}`);
      router.refresh();
    } catch {
      setError("No pudimos conectar con el servidor. Revisa tu conexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-up">
      <Link
        href="/viajes"
        className="mb-5 inline-flex items-center gap-1.5 text-[13.5px] text-slate-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a mis viajes
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-white">Nuevo viaje</h1>
      <p className="mt-1.5 text-[14.5px] text-slate-400">
        Define el destino y el presupuesto. Podras registrar gastos apenas lo crees.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        {error && <Alert tone="error">{error}</Alert>}

        {/* ------------------------------- Destino ------------------------------ */}
        <section className="card card-pad space-y-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">Destino</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ciudad o destino" htmlFor="destination" error={fields.destination}>
              <Input
                id="destination"
                placeholder="Lisboa"
                value={values.destination}
                onChange={set("destination")}
                required
              />
            </Field>
            <Field label="Pais (opcional)" htmlFor="country" error={fields.country}>
              <Input id="country" placeholder="Portugal" value={values.country} onChange={set("country")} />
            </Field>
          </div>

          <div>
            <span className="label-base">Icono</span>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setValues((v) => ({ ...v, coverEmoji: emoji }))}
                  aria-label={`Elegir icono ${emoji}`}
                  aria-pressed={values.coverEmoji === emoji}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition-all ${
                    values.coverEmoji === emoji
                      ? "border-brand-500 bg-brand-600/20 scale-105"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------- Presupuesto ---------------------------- */}
        <section className="card card-pad space-y-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">
            Presupuesto y fechas
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Limite de presupuesto" htmlFor="budget" error={fields.budget} className="sm:col-span-2">
              <Input
                id="budget"
                type="number"
                min="1"
                step="0.01"
                inputMode="decimal"
                placeholder="2400"
                value={values.budget}
                onChange={set("budget")}
                required
              />
            </Field>
            <Field label="Moneda" htmlFor="currency" error={fields.currency}>
              <Select id="currency" value={values.currency} onChange={set("currency")}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha de inicio" htmlFor="startDate" error={fields.startDate}>
              <Input id="startDate" type="date" value={values.startDate} onChange={set("startDate")} required />
            </Field>
            <Field
              label="Fecha de fin"
              htmlFor="endDate"
              error={fields.endDate}
              hint="No se permiten viajes que ya terminaron"
            >
              <Input
                id="endDate"
                type="date"
                min={values.startDate}
                value={values.endDate}
                onChange={set("endDate")}
                required
              />
            </Field>
          </div>
        </section>

        {/* --------------------------- Acompanantes ---------------------------- */}
        <section className="card card-pad space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">
              Acompanantes
            </h2>
            <Button type="button" variant="secondary" size="sm" onClick={addCompanion}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Agregar
            </Button>
          </div>

          {companions.length === 0 ? (
            <p className="text-[13.5px] text-slate-500">
              Viajas solo. Agrega acompanantes para repartir los gastos entre el grupo.
            </p>
          ) : (
            <div className="space-y-3">
              {companions.map((c, index) => (
                <div key={c.key} className="flex items-start gap-2">
                  <Input
                    aria-label={`Nombre del acompanante ${index + 1}`}
                    placeholder="Nombre"
                    value={c.name}
                    onChange={(e) => updateCompanion(c.key, { name: e.target.value })}
                  />
                  <Input
                    aria-label={`Correo del acompanante ${index + 1}`}
                    type="email"
                    placeholder="Correo (opcional)"
                    value={c.email}
                    onChange={(e) => updateCompanion(c.key, { email: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    aria-label={`Quitar acompanante ${index + 1}`}
                    onClick={() => removeCompanion(c.key)}
                    className="!px-2.5 shrink-0 text-slate-500 hover:text-rose-300"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* -------------------------------- Notas ------------------------------ */}
        <section className="card card-pad">
          <Field label="Notas (opcional)" htmlFor="notes" error={fields.notes}>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Itinerario, reservas pendientes, recordatorios..."
              value={values.notes}
              onChange={set("notes")}
            />
          </Field>
        </section>

        <div className="flex justify-end gap-3 pb-4">
          <Link href="/viajes">
            <Button type="button" variant="secondary" size="lg">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" size="lg" loading={loading}>
            Crear viaje
          </Button>
        </div>
      </form>
    </div>
  );
}
