"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { CATEGORIES, CATEGORY_META } from "@/lib/categories";
import { toDateInput } from "@/lib/format";
import { revalidateTrip } from "@/hooks/useTrip";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

type Props = {
  tripId: string;
  currency: string;
  people: string[];
  minDate: string;
  maxDate: string;
};

const EMPTY = (minDate: string, maxDate: string) => {
  const today = toDateInput(new Date());
  const date = today < minDate ? minDate : today > maxDate ? maxDate : today;
  return { amount: "", category: "FOOD", description: "", date, paidBy: "Yo" };
};

export function ExpenseForm({ tripId, currency, people, minDate, maxDate }: Props) {
  const [values, setValues] = useState(() => EMPTY(minDate, maxDate));
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const set =
    (key: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFields({});

    try {
      const response = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, amount: Number(values.amount), source: "MANUAL" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No pudimos guardar el gasto");
        setFields(data.fields ?? {});
        return;
      }

      // Las graficas y el panel de IA se recalculan al instante.
      await revalidateTrip(tripId);

      setValues(EMPTY(minDate, maxDate));
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      {error && <Alert tone="error">{error}</Alert>}
      {saved && <Alert tone="success">Gasto registrado. Las graficas ya estan actualizadas.</Alert>}

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label={`Monto (${currency})`} htmlFor="amount" error={fields.amount}>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="45.90"
            value={values.amount}
            onChange={set("amount")}
            required
          />
        </Field>

        <Field label="Categoria" htmlFor="category" error={fields.category}>
          <Select id="category" value={values.category} onChange={set("category")}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Descripcion" htmlFor="description" error={fields.description}>
        <Input
          id="description"
          placeholder="Cena en Bairro Alto"
          value={values.description}
          onChange={set("description")}
          maxLength={120}
          required
        />
      </Field>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Fecha" htmlFor="date" error={fields.date}>
          <Input
            id="date"
            type="date"
            min={minDate}
            max={maxDate}
            value={values.date}
            onChange={set("date")}
            required
          />
        </Field>

        <Field label="Pagado por" htmlFor="paidBy" error={fields.paidBy}>
          <Select id="paidBy" value={values.paidBy} onChange={set("paidBy")}>
            {people.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Button type="submit" size="lg" loading={loading} className="w-full">
        {saved ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        {saved ? "Registrado" : "Registrar gasto"}
      </Button>
    </form>
  );
}
