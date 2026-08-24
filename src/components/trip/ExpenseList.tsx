"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import type { ExpenseDTO } from "@/hooks/useTrip";
import { revalidateTrip } from "@/hooks/useTrip";
import { categoryMeta } from "@/lib/categories";
import { formatDate, formatMoney, cn } from "@/lib/format";

type Order = "date_desc" | "date_asc" | "amount_desc";

const ORDER_LABEL: Record<Order, string> = {
  date_desc: "fecha (mas reciente)",
  date_asc: "fecha (mas antigua)",
  amount_desc: "monto (mayor primero)",
};

export function ExpenseList({
  tripId,
  expenses,
  currency,
}: {
  tripId: string;
  expenses: ExpenseDTO[];
  currency: string;
}) {
  const [order, setOrder] = useState<Order>("date_desc");
  const [deleting, setDeleting] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const copy = [...expenses];
    if (order === "amount_desc") return copy.sort((a, b) => b.amount - a.amount);
    const dir = order === "date_asc" ? 1 : -1;
    return copy.sort(
      (a, b) => dir * (new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt.localeCompare(b.createdAt))
    );
  }, [expenses, order]);

  async function remove(expense: ExpenseDTO) {
    if (!confirm(`¿Eliminar "${expense.description}"? Esta accion no se puede deshacer.`)) return;
    setDeleting(expense.id);
    try {
      const response = await fetch(`/api/trips/${tripId}/expenses/${expense.id}`, { method: "DELETE" });
      if (response.ok) await revalidateTrip(tripId);
    } finally {
      setDeleting(null);
    }
  }

  if (expenses.length === 0) {
    return <p className="text-[14px] text-ink-500">Aun no has anadido ningun gasto.</p>;
  }

  return (
    <section>
      <header className="mb-3 flex items-center justify-between gap-4">
        <h3 className="text-[17px] font-bold tracking-tight text-ink-900">Gastos</h3>
        <label className="flex items-center gap-1.5 text-[13px] text-ink-500">
          <span className="hidden sm:inline">Orden:</span>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as Order)}
            aria-label="Ordenar gastos"
            className="cursor-pointer rounded-lg border-0 bg-transparent py-1 pr-1 text-[13px] font-medium text-ink-500 outline-none focus:text-brand-600"
          >
            {(Object.keys(ORDER_LABEL) as Order[]).map((key) => (
              <option key={key} value={key}>
                {ORDER_LABEL[key]}
              </option>
            ))}
          </select>
        </label>
      </header>

      <ul className="space-y-2.5">
        {sorted.map((expense) => {
          const meta = categoryMeta(expense.category);
          return (
            <li
              key={expense.id}
              className="group flex items-center gap-3.5 rounded-[14px] border border-cream-300 bg-white px-4 py-3 transition-shadow hover:shadow-sm"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px]"
                style={{ backgroundColor: `${meta.color}1f` }}
                title={meta.label}
              >
                {meta.emoji}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-ink-900">{expense.description}</p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-ink-400">
                  <span>{meta.label}</span>
                  <span aria-hidden>·</span>
                  <span>{formatDate(expense.date, { day: "2-digit", month: "short" })}</span>
                  {expense.paidBy !== "Yo" && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="truncate">{expense.paidBy}</span>
                    </>
                  )}
                  {expense.splitMode === "EQUAL" && (
                    <span className="rounded-full bg-cream-200 px-1.5 py-0.5 text-[10.5px] font-medium text-ink-500">
                      dividido
                    </span>
                  )}
                  {expense.source === "CHATBOT" && (
                    <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-medium text-brand-600">
                      IA
                    </span>
                  )}
                </p>
              </div>

              {expense.receiptUrl && (
                <a
                  href={expense.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden shrink-0 sm:block"
                  title="Ver la foto del recibo"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={expense.receiptUrl}
                    alt={`Recibo de ${expense.description}`}
                    className="h-9 w-9 rounded-lg border border-cream-300 object-cover"
                  />
                </a>
              )}

              <span className="shrink-0 text-[14px] font-bold text-ink-900">
                {currency} {new Intl.NumberFormat("en-US").format(Math.round(expense.amount))}
              </span>

              <button
                type="button"
                onClick={() => remove(expense)}
                disabled={deleting === expense.id}
                aria-label={`Eliminar ${expense.description}`}
                className={cn(
                  "shrink-0 rounded-lg p-1.5 text-ink-300 transition-all",
                  "opacity-0 hover:bg-alert-500/10 hover:text-alert-500 focus-visible:opacity-100 group-hover:opacity-100",
                  "disabled:opacity-40"
                )}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
