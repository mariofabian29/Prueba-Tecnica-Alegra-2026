"use client";

import { useState } from "react";
import { CATEGORY_META, CATEGORY_PICKER_ORDER, isCategory, type Category } from "@/lib/categories";
import { formatDate, formatMoney, toDateInput } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export type Draft = {
  amount: number | null;
  category: string;
  description: string;
  date: string;
  receiptUrl?: string | null;
};

/**
 * Tarjeta de confirmacion del gasto leido del recibo.
 * Permite editar monto, categoría y fecha antes de cargarlo.
 */
export function DraftCard({
  draft,
  currency,
  saving,
  onConfirm,
}: {
  draft: Draft;
  currency: string;
  saving: boolean;
  onConfirm: (draft: Draft) => void;
}) {
  const [editing, setEditing] = useState(draft.amount === null);
  const [amount, setAmount] = useState(draft.amount != null ? String(draft.amount) : "");
  const [category, setCategory] = useState<Category>(
    isCategory(draft.category) ? draft.category : "OTHER"
  );
  const [date, setDate] = useState(draft.date || toDateInput(new Date()));
  const [description, setDescription] = useState(draft.description);
  const [error, setError] = useState<string | null>(null);

  const meta = CATEGORY_META[category];

  function confirm() {
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Ingresa un monto mayor a 0.");
      setEditing(true);
      return;
    }
    setError(null);
    onConfirm({ ...draft, amount: value, category, date, description });
  }

  return (
    <div className="max-w-[560px] rounded-[6px] border border-brand-300 bg-white px-6 py-5">
      <p className="mb-4 text-[13px] font-semibold text-brand-600">
        Confirma la información y la cargo automáticamente
      </p>

      {editing ? (
        <div className="space-y-3">
          <Row label="Monto">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              aria-label={`Monto en ${currency}`}
              className="w-32 rounded-lg bg-cream-200 px-3 py-1.5 text-right text-[14px] font-semibold text-ink-900 outline-none focus:ring-2 focus:ring-brand-300"
            />
          </Row>

          <Row label="Descripción">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={120}
              aria-label="Descripción del gasto"
              className="w-56 rounded-lg bg-cream-200 px-3 py-1.5 text-right text-[14px] text-ink-900 outline-none focus:ring-2 focus:ring-brand-300"
            />
          </Row>

          <Row label="Categoría">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              aria-label="Categoría del gasto"
              className="cursor-pointer rounded-lg bg-cream-200 px-3 py-1.5 text-[14px] text-ink-900 outline-none focus:ring-2 focus:ring-brand-300"
            >
              {CATEGORY_PICKER_ORDER.map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_META[key].emoji} {CATEGORY_META[key].label}
                </option>
              ))}
            </select>
          </Row>

          <Row label="Fecha">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Fecha del gasto"
              className="cursor-pointer rounded-lg bg-cream-200 px-3 py-1.5 text-[14px] text-ink-900 outline-none focus:ring-2 focus:ring-brand-300"
            />
          </Row>
        </div>
      ) : (
        <dl className="space-y-3">
          <Row label="Monto">
            <span className="text-[15px] font-bold text-ink-900">
              {formatMoney(Number(amount), currency)}
            </span>
          </Row>
          <Row label="Categoría">
            <span className="text-[14px] text-ink-800">
              {meta.emoji} {meta.label}
            </span>
          </Row>
          <Row label="Fecha">
            <span className="text-[14px] text-ink-800">
              {date === toDateInput(new Date())
                ? "Hoy"
                : formatDate(`${date}T12:00:00`, { day: "2-digit", month: "short" })}
            </span>
          </Row>
        </dl>
      )}

      {error && <p className="mt-3 text-[12.5px] text-alert-500">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={confirm} loading={saving} className="min-w-[120px]">
          Confirmar
        </Button>
        <Button variant="outline" onClick={() => setEditing((v) => !v)} disabled={saving}>
          {editing ? "Listo" : "Editar"}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[14px] text-ink-700">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
