"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";

/** Tarjeta para tomar la foto del recibo o elegirla de la galeria. */
export function UploadCard({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-[420px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center gap-4 rounded-[6px] border border-brand-300 bg-white px-6 py-7 text-left transition-colors hover:bg-brand-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream-300">
          <Upload className="h-5 w-5 text-ink-800" aria-hidden />
        </span>
        <span className="text-[15px] leading-snug text-ink-900">
          Toca para abrir la camara
          <br />o elegir tu foto de la galeria
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
