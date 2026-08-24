"use client";

import { ArrowLeft, X } from "lucide-react";
import { CATEGORY_META, CATEGORY_PICKER_ORDER, type Category } from "@/lib/categories";

/** Segundo paso del popup: elegir la categoría del gasto. */
export function CategoryPicker({
  selected,
  onBack,
  onClose,
  onSelect,
}: {
  selected: Category | null;
  onBack: () => void;
  onClose: () => void;
  onSelect: (category: Category) => void;
}) {
  return (
    <div>
      <header className="relative mb-6 flex items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="absolute left-0 rounded-lg p-1 text-ink-800 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <h2 id="expense-modal-title" className="text-[19px] font-bold tracking-tight text-ink-900">
          Selecciona categoría de gasto
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-0 rounded-lg p-1 text-ink-500 transition-colors hover:text-ink-900"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CATEGORY_PICKER_ORDER.map((category) => {
          const meta = CATEGORY_META[category];
          const isSelected = category === selected;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelect(category)}
              aria-pressed={isSelected}
              className={`flex flex-col items-center gap-2 rounded-[14px] px-2 py-5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                isSelected
                  ? "bg-brand-50 ring-2 ring-brand-400"
                  : "bg-cream-200 hover:bg-brand-50 hover:ring-2 hover:ring-brand-300"
              }`}
            >
              <span className="text-[22px]" aria-hidden>
                {meta.emoji}
              </span>
              <span className="text-center text-[13px] font-medium text-ink-700">{meta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
