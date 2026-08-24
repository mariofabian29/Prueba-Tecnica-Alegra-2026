"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { startOfDay, toDateInput, cn } from "@/lib/format";

const WEEKDAYS = ["lu", "ma", "mi", "ju", "vi", "sa", "do"];

type Props = {
  start: string;
  end: string;
  onChange: (range: { start: string; end: string }) => void;
  /** No se pueden elegir días anteriores a este (por defecto, hoy). */
  min?: Date;
};

/** Calendario de rango en español, con la semana empezando en lunes. */
export function DateRangePicker({ start, end, onChange, min }: Props) {
  const today = startOfDay(new Date());
  const minDay = startOfDay(min ?? today);
  const [cursor, setCursor] = useState(() => {
    const base = start ? new Date(`${start}T12:00:00`) : today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // "agosto 2026" en vez de "agosto de 2026"
  const monthLabel = [
    new Intl.DateTimeFormat("es-CO", { month: "long" }).format(cursor),
    cursor.getFullYear(),
  ].join(" ");
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  // getDay(): 0 = domingo. Convertimos a semana que empieza en lunes.
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  function select(day: Date) {
    const iso = toDateInput(day);
    // Sin rango o con rango completo: empezamos uno nuevo.
    if (!start || (start && end)) {
      onChange({ start: iso, end: "" });
      return;
    }
    // Con solo el inicio: cerramos el rango (invirtiendo si hace falta).
    onChange(iso < start ? { start: iso, end: start } : { start, end: iso });
  }

  function stateOf(day: Date) {
    const iso = toDateInput(day);
    const isStart = iso === start;
    const isEnd = iso === end;
    const inRange = Boolean(start && end && iso > start && iso < end);
    return { isStart, isEnd, inRange, selected: isStart || isEnd || inRange };
  }

  return (
    <div className="rounded-[20px] bg-cream-200 px-6 py-5">
      <header className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          aria-label="Mes anterior"
          className="rounded-lg p-1.5 text-ink-800 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
        <p className="text-[15px] font-bold text-ink-900">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          aria-label="Mes siguiente"
          className="rounded-lg p-1.5 text-ink-800 transition-colors hover:text-brand-600"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </header>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="pb-2 text-[12px] font-medium text-ink-400">
            {day}
          </span>
        ))}

        {cells.map((day, index) => {
          if (!day) return <span key={`blank-${index}`} />;

          const disabled = startOfDay(day) < minDay;
          const { isStart, isEnd, inRange, selected } = stateOf(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => select(day)}
              aria-pressed={selected}
              aria-label={new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(day)}
              className={cn(
                "mx-auto flex h-8 w-full max-w-[52px] items-center justify-center text-[13.5px] transition-colors",
                selected ? "text-white" : disabled ? "text-ink-300" : "text-ink-800 hover:text-brand-600",
                selected && "brand-gradient",
                isStart && !isEnd && "rounded-pill",
                isStart && isEnd && "rounded-pill",
                isStart && end && !isEnd && "rounded-l-pill",
                isEnd && !isStart && "rounded-r-pill",
                inRange && "rounded-none",
                !selected && "rounded-pill",
                disabled && "cursor-not-allowed"
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      {(start || end) && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => onChange({ start: "", end: "" })}
            className="text-[14px] text-ink-800 transition-colors hover:text-brand-600"
          >
            Borrar fechas
          </button>
        </div>
      )}
    </div>
  );
}
