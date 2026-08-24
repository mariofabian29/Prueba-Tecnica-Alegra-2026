"use client";

import { useMemo, useState } from "react";
import { Bot, Hand, Search, Trash2 } from "lucide-react";
import type { ExpenseDTO } from "@/hooks/useTrip";
import { revalidateTrip } from "@/hooks/useTrip";
import { CATEGORIES, CATEGORY_META, categoryMeta } from "@/lib/categories";
import { formatDate, formatMoney, cn } from "@/lib/format";
import { Select } from "@/components/ui/Field";

type Props = { tripId: string; expenses: ExpenseDTO[]; currency: string };

export function ExpenseList({ tripId, expenses, currency }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((e) => {
      const matchesQuery =
        !q || e.description.toLowerCase().includes(q) || e.paidBy.toLowerCase().includes(q);
      const matchesCategory = category === "ALL" || e.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [expenses, query, category]);

  async function remove(id: string) {
    if (!confirm("¿Eliminar este gasto? Esta accion no se puede deshacer.")) return;
    setDeleting(id);
    try {
      const response = await fetch(`/api/trips/${tripId}/expenses/${id}`, { method: "DELETE" });
      if (response.ok) await revalidateTrip(tripId);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className="card card-pad">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-white">Gastos registrados</h3>
          <p className="mt-0.5 text-[12.5px] text-slate-400">
            {expenses.length} en total
            {filtered.length !== expenses.length && ` · ${filtered.length} coinciden con el filtro`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              aria-label="Buscar gastos"
              className="input-base !h-9 !w-40 !py-0 !pl-8 !text-[13px]"
            />
          </div>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filtrar por categoria"
            className="!h-9 !w-auto !py-0 !text-[13px]"
          >
            <option value="ALL">Todas</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
              </option>
            ))}
          </Select>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
          <p className="text-[13.5px] text-slate-500">
            {expenses.length === 0
              ? "Aun no hay gastos. Registra el primero con el formulario o el chat."
              : "Ningun gasto coincide con el filtro."}
          </p>
        </div>
      ) : (
        <ul className="-mx-1 max-h-[420px] space-y-0.5 overflow-y-auto px-1">
          {filtered.map((expense) => {
            const meta = categoryMeta(expense.category);
            return (
              <li
                key={expense.id}
                className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-white/[0.04]"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                  style={{ backgroundColor: `${meta.color}22` }}
                  title={meta.label}
                >
                  {meta.emoji}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-slate-100">{expense.description}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-500">
                    <span>{formatDate(expense.date)}</span>
                    <span aria-hidden>·</span>
                    <span className="truncate">{expense.paidBy}</span>
                    <span
                      className={cn(
                        "ml-0.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-medium",
                        expense.source === "CHATBOT"
                          ? "bg-brand-500/15 text-brand-300"
                          : "bg-white/[0.06] text-slate-400"
                      )}
                      title={expense.source === "CHATBOT" ? "Registrado por el chatbot" : "Registro manual"}
                    >
                      {expense.source === "CHATBOT" ? (
                        <Bot className="h-2.5 w-2.5" aria-hidden />
                      ) : (
                        <Hand className="h-2.5 w-2.5" aria-hidden />
                      )}
                      {expense.source === "CHATBOT" ? "Chat" : "Manual"}
                    </span>
                  </p>
                </div>

                <span className="shrink-0 text-[13.5px] font-semibold text-white">
                  {formatMoney(expense.amount, currency)}
                </span>

                <button
                  type="button"
                  onClick={() => remove(expense.id)}
                  disabled={deleting === expense.id}
                  aria-label={`Eliminar gasto ${expense.description}`}
                  className="shrink-0 rounded-lg p-1.5 text-slate-600 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-300 focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
