"use client";

import { useRef, useState } from "react";
import { Camera, ChevronDown, X } from "lucide-react";
import { CATEGORY_META, type Category } from "@/lib/categories";
import { formatDate, toDateInput } from "@/lib/format";
import { revalidateTrip } from "@/hooks/useTrip";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CategoryPicker } from "./CategoryPicker";

type Props = {
  open: boolean;
  onClose: () => void;
  tripId: string;
  currency: string;
  /** Primer elemento siempre "Yo"; el resto son los acompanantes. */
  people: string[];
  companionCount: number;
  /** Nombre de la persona con sesion iniciada, para la etiqueta "Tu (...)". */
  userName: string;
};

type Step = "form" | "category";

export function AddExpenseModal({
  open,
  onClose,
  tripId,
  currency,
  people,
  companionCount,
  userName,
}: Props) {
  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [place, setPlace] = useState("");
  const [paidBy, setPaidBy] = useState(people[0] ?? "Yo");
  const [splitMode, setSplitMode] = useState<"NONE" | "EQUAL">("NONE");
  const [date, setDate] = useState("");
  const [receipt, setReceipt] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("form");
    setAmount("");
    setCategory(null);
    setPlace("");
    setPaidBy(people[0] ?? "Yo");
    setSplitMode("NONE");
    setDate("");
    setReceipt(null);
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function uploadReceipt(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`/api/trips/${tripId}/receipt`, { method: "POST", body });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No pudimos subir la foto");
        return;
      }

      setReceipt({ url: data.receiptUrl, name: file.name });

      // Si la IA logro leer el recibo, prellenamos el formulario.
      if (data.extracted && data.draft) {
        if (!amount) setAmount(String(data.draft.amount ?? ""));
        if (!category) setCategory(data.draft.category as Category);
        if (!place) setPlace(data.draft.description ?? "");
        if (!date) setDate(data.draft.date ?? "");
      }
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Ingresa un monto mayor a 0.");
      return;
    }
    if (!category) {
      setError("Selecciona una categoría de gasto.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: value,
          category,
          description: place || CATEGORY_META[category].label,
          place,
          date: date || toDateInput(new Date()),
          paidBy,
          splitMode,
          receiptUrl: receipt?.url ?? "",
          source: "MANUAL",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "No pudimos guardar el gasto");
        return;
      }

      await revalidateTrip(tripId);
      close();
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={close} labelledBy="expense-modal-title">
      {step === "category" ? (
        <CategoryPicker
          place={place}
          onBack={() => setStep("form")}
          onClose={close}
          onSelect={(selected, selectedPlace) => {
            setCategory(selected);
            setPlace(selectedPlace);
            setStep("form");
          }}
        />
      ) : (
        <form onSubmit={save}>
          <header className="relative mb-6 flex items-center justify-center">
            <h2 id="expense-modal-title" className="text-[19px] font-bold tracking-tight text-ink-900">
              Añadir gasto
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="absolute right-0 rounded-lg p-1 text-ink-500 transition-colors hover:text-ink-900"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>

          {error && <Alert tone="error" className="mb-4">{error}</Alert>}

          <div className="flex items-center gap-2 rounded-[14px] bg-cream-200 px-4 focus-within:ring-2 focus-within:ring-brand-300">
            <span className="text-[15px] font-medium text-ink-400">{currency}</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              aria-label={`Monto en ${currency}`}
              className="w-full border-0 bg-transparent py-3.5 text-[16px] font-semibold text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setStep("category")}
            className="mt-3 flex w-full items-center justify-between rounded-[14px] bg-cream-200 px-4 py-3.5 text-left text-[15px] transition-colors hover:bg-cream-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            <span className={category ? "font-medium text-ink-900" : "text-ink-400"}>
              {category ? `${CATEGORY_META[category].emoji} ${CATEGORY_META[category].label}` : "Categoría de gasto"}
              {category && place && <span className="ml-1.5 font-normal text-ink-500">· {place}</span>}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
          </button>

          <dl className="mt-5 space-y-3.5">
            <SelectRow
              label="Pagado por"
              value={paidBy}
              onChange={setPaidBy}
              options={people.map((p) => ({
                value: p,
                label: p === "Yo" ? `Tú (${userName})` : p,
              }))}
            />

            <SelectRow
              label="Dividir"
              value={splitMode}
              onChange={(v) => setSplitMode(v as "NONE" | "EQUAL")}
              options={[
                { value: "NONE", label: "No dividir" },
                {
                  value: "EQUAL",
                  label:
                    companionCount > 0
                      ? `En partes iguales (${companionCount + 1})`
                      : "En partes iguales",
                },
              ]}
              disabled={companionCount === 0}
              hint={companionCount === 0 ? "Este viaje no tiene acompañantes" : undefined}
            />

            <div className="flex items-center justify-between gap-4">
              <label htmlFor="expense-date" className="text-[13.5px] font-semibold text-ink-500">
                Fecha: Opcional
              </label>
              {/* El input nativo se superpone invisible para conservar el
                  selector del sistema sin mostrar su texto parcial. */}
              <div className="relative flex items-center gap-1.5">
                <span className="text-[14px] text-ink-700">
                  {date ? formatDate(`${date}T12:00:00`, { day: "2-digit", month: "short" }) : "Hoy"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                <input
                  id="expense-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-label="Fecha del gasto"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-[13.5px] font-semibold text-ink-500">Foto del recibo: Opcional</span>
              {receipt && (
                <button
                  type="button"
                  onClick={() => setReceipt(null)}
                  className="text-[13px] text-ink-400 underline transition-colors hover:text-alert-500"
                >
                  Quitar
                </button>
              )}
            </div>
          </dl>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadReceipt(file);
              e.target.value = "";
            }}
          />

          <div className="mt-5 flex justify-center">
            {receipt ? (
              <a href={receipt.url} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={receipt.url}
                  alt="Recibo adjunto"
                  className="h-28 rounded-[14px] border border-cream-300 object-cover"
                />
              </a>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="lg"
                loading={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="h-4 w-4" aria-hidden />
                Subir foto del recibo
              </Button>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <Button type="submit" size="lg" loading={saving} className="min-w-[140px]">
              Guardar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function SelectRow({
  label,
  value,
  onChange,
  options,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  hint?: string;
}) {
  const id = `row-${label.toLowerCase().replace(/\s/g, "-")}`;
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="text-[13.5px] font-semibold text-ink-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        title={hint}
        className="max-w-[62%] cursor-pointer truncate rounded-lg border-0 bg-transparent py-1 text-right text-[14px] text-ink-700 outline-none focus:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
