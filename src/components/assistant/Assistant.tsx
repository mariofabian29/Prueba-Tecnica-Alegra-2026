"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Sparkles, X } from "lucide-react";
import { useChat, revalidateTrip, type ChatMessageDTO } from "@/hooks/useTrip";
import { cn } from "@/lib/format";
import { prepareReceipt } from "@/lib/image";
import { Button } from "@/components/ui/Button";
import { UploadCard } from "./UploadCard";
import { DraftCard, type Draft } from "./DraftCard";

const QUICK_REPLIES = ["Gasté en comida", "Pagué el hotel", "Anota una compra"];

type Pending = { id: string; role: "user"; content: string };

export function Assistant({
  tripId,
  destination,
  currency,
}: {
  tripId: string;
  destination: string;
  currency: string;
}) {
  const { messages, mutate } = useChat(tripId);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = sending || uploading;
  const isEmpty = messages.length === 0 && !pending;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;

    setSending(true);
    setError(null);
    setInput("");
    setPending({ id: `pending-${Date.now()}`, role: "user", content: message });

    try {
      const response = await fetch(`/api/trips/${tripId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No pudimos procesar tu mensaje");
        setInput(message);
        return;
      }

      await mutate();
      if (data.intent === "add_expense") await revalidateTrip(tripId);
    } catch {
      setError("No pudimos conectar con el servidor.");
      setInput(message);
    } finally {
      setPending(null);
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function uploadReceipt(file: File) {
    if (busy) return;
    setUploading(true);
    setError(null);
    try {
      // Se reduce en el navegador: la foto viaja ligera y cabe en la base de datos.
      const prepared = await prepareReceipt(file);
      const body = new FormData();
      body.append("file", new File([prepared.blob], file.name, { type: prepared.type }));
      const response = await fetch(`/api/trips/${tripId}/receipt`, { method: "POST", body });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No pudimos subir la foto");
        return;
      }
      await mutate();
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setUploading(false);
    }
  }

  async function confirmDraft(messageId: string, draft: Draft) {
    setConfirming(messageId);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: draft.amount,
          category: draft.category,
          description: draft.description,
          date: draft.date,
          paidBy: "Yo",
          receiptUrl: draft.receiptUrl ?? "",
          source: "CHATBOT",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No pudimos registrar el gasto");
        return;
      }

      // Deja constancia en el chat y refresca el dashboard.
      await fetch(`/api/trips/${tripId}/chat/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, expenseId: data.expense.id }),
      });
      await Promise.all([mutate(), revalidateTrip(tripId)]);
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setConfirming(null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-72px-48px)] min-h-[560px] flex-col bg-cream-50">
      <header className="px-8 pt-6">
        <Link
          href={`/viajes/${tripId}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al viaje
        </Link>

        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="text-[22px] font-bold tracking-tight text-ink-900">Asistente de IA</h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-[12.5px] font-medium text-ink-400 sm:inline">
              Viaje a {destination}
            </span>
            <Link
              href={`/viajes/${tripId}`}
              aria-label="Cerrar el asistente y volver al viaje"
              title="Cerrar el asistente"
              className="rounded-full p-2 text-ink-500 transition-colors hover:bg-cream-200 hover:text-ink-900"
            >
              <X className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        {isEmpty ? (
          <Welcome onPick={send} disabled={busy} />
        ) : (
          <div className="space-y-5">
            {messages.map((message) => (
              <Bubble
                key={message.id}
                message={message}
                currency={currency}
                confirming={confirming === message.id}
                onConfirm={(draft) => confirmDraft(message.id, draft)}
                onUpload={uploadReceipt}
                uploading={uploading}
              />
            ))}

            {pending && <UserBubble content={pending.content} />}

            {busy && (
              <div className="flex gap-1.5 rounded-[14px] bg-cream-200 px-5 py-4 max-w-[120px]">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 animate-pulse-soft rounded-full bg-ink-300"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-[13px] text-alert-500">{error}</p>}
      </div>

      {!isEmpty && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-3 border-t border-cream-300 px-8 py-4"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            maxLength={600}
            disabled={busy}
            aria-label="Mensaje para el asistente"
            className="input-base flex-1"
          />
          <Button type="submit" loading={sending} disabled={!input.trim()} aria-label="Enviar" className="!px-4">
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </form>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Welcome({ onPick, disabled }: { onPick: (text: string) => void; disabled: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
        <Sparkles className="h-5 w-5 text-brand-900" aria-hidden />
      </span>
      <h2 className="text-[24px] font-bold tracking-tight text-ink-900">Asistente de IA</h2>
      <p className="mt-2 max-w-[380px] text-[14.5px] leading-relaxed text-ink-700">
        Cuéntame qué gastaste y lo registro por ti — monto, categoría y fecha, automáticamente.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {QUICK_REPLIES.map((reply) => (
          <button
            key={reply}
            type="button"
            disabled={disabled}
            onClick={() => onPick(reply)}
            className="rounded-pill border border-brand-300 bg-white px-6 py-3 text-[14px] font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-50"
          >
            {reply}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const field = (e.currentTarget.elements.namedItem("welcome-input") as HTMLInputElement);
          onPick(field.value);
          field.value = "";
        }}
        className="mt-6 w-full max-w-[620px]"
      >
        <input
          name="welcome-input"
          placeholder="Escribe un mensaje..."
          maxLength={600}
          disabled={disabled}
          aria-label="Mensaje para el asistente"
          className="input-base !py-4 text-center"
        />
      </form>
    </div>
  );
}

function Bubble({
  message,
  currency,
  confirming,
  onConfirm,
  onUpload,
  uploading,
}: {
  message: ChatMessageDTO;
  currency: string;
  confirming: boolean;
  onConfirm: (draft: Draft) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  if (message.kind === "receipt") {
    const payload = safeParse<{ receiptUrl: string }>(message.payload);
    return (
      <div className="flex justify-end">
        <div className="max-w-[420px] overflow-hidden rounded-[14px] brand-gradient p-3">
          {payload?.receiptUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={payload.receiptUrl}
              alt="Foto del recibo"
              className="ml-auto max-h-[280px] rounded-lg object-contain"
            />
          )}
        </div>
      </div>
    );
  }

  if (message.kind === "draft") {
    const draft = safeParse<Draft>(message.payload);
    if (draft) {
      return <DraftCard draft={draft} currency={currency} saving={confirming} onConfirm={onConfirm} />;
    }
  }

  if (message.kind === "upload") {
    return (
      <div className="space-y-4">
        <AssistantBubble content={message.content} />
        <UploadCard onFile={onUpload} disabled={uploading} />
      </div>
    );
  }

  return message.role === "user" ? (
    <UserBubble content={message.content} />
  ) : (
    <AssistantBubble content={message.content} />
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[70%] rounded-[14px] brand-gradient px-6 py-4 text-right text-[14.5px] leading-relaxed text-white">
        {content}
      </p>
    </div>
  );
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <p className={cn("max-w-[70%] rounded-[14px] bg-cream-200 px-6 py-4 text-[14.5px] leading-relaxed text-ink-900")}>
      {content}
    </p>
  );
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
