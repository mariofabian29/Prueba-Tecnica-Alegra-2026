"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, Trash2, User } from "lucide-react";
import { useChat, revalidateTrip, type ChatMessageDTO } from "@/hooks/useTrip";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/format";

const SUGGESTIONS = [
  "Gaste 45 en la cena de anoche",
  "¿Cuanto me queda?",
  "Pague 120 de hotel ayer",
  "Dame una recomendacion",
];

export function ChatBot({ tripId }: { tripId: string }) {
  const { messages, mutate } = useChat(tripId);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<ChatMessageDTO | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const visible = pending ? [...messages, pending] : messages;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visible.length, sending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;

    setSending(true);
    setError(null);
    setInput("");

    // Eco optimista: el mensaje del usuario aparece de inmediato.
    setPending({
      id: `pending-${Date.now()}`,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    });

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
      // Si el bot creo un gasto, refrescamos graficas y panel de IA.
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

  async function clearChat() {
    await fetch(`/api/trips/${tripId}/chat`, { method: "DELETE" });
    await mutate();
  }

  return (
    <div className="flex h-full min-h-[460px] flex-col">
      {/* -------------------------------- Historial ------------------------------ */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <Welcome />
        ) : (
          visible.map((message) => <Bubble key={message.id} message={message} />)
        )}

        {sending && (
          <div className="flex items-center gap-2.5">
            <Avatar role="assistant" />
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white/[0.06] px-3.5 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-slate-400"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------- Sugerencias ----------------------------- */}
      {visible.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={sending}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-slate-300 transition-colors hover:border-brand-500/40 hover:bg-brand-600/10 hover:text-white disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-[12.5px] text-rose-300">{error}</p>}

      {/* --------------------------------- Input -------------------------------- */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-center gap-2 border-t border-white/[0.07] pt-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Ej: "gaste 32 en el almuerzo de hoy"'
          maxLength={600}
          disabled={sending}
          aria-label="Mensaje para el asistente de gastos"
          className="input-base flex-1"
        />
        <Button type="submit" loading={sending} disabled={!input.trim()} aria-label="Enviar mensaje" className="!px-3">
          <Send className="h-4 w-4" aria-hidden />
        </Button>
        {messages.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={clearChat}
            aria-label="Limpiar conversacion"
            className="!px-2.5 text-slate-500 hover:text-rose-300"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </form>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessageDTO }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex animate-fade-up items-end gap-2.5", isUser && "flex-row-reverse")}>
      <Avatar role={message.role} />
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap",
          isUser
            ? "rounded-br-md bg-brand-600 text-white"
            : "rounded-bl-md bg-white/[0.06] text-slate-200"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function Avatar({ role }: { role: string }) {
  const isUser = role === "user";
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1",
        isUser ? "bg-brand-600/25 ring-brand-500/30" : "bg-white/[0.06] ring-white/10"
      )}
      aria-hidden
    >
      {isUser ? (
        <User className="h-3.5 w-3.5 text-brand-200" />
      ) : (
        <Bot className="h-3.5 w-3.5 text-slate-300" />
      )}
    </span>
  );
}

function Welcome() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15 ring-1 ring-brand-500/25">
        <Sparkles className="h-5 w-5 text-brand-300" aria-hidden />
      </span>
      <p className="text-[14px] font-semibold text-white">Registra gastos escribiendo</p>
      <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-slate-400">
        Cuentame en lenguaje natural que gastaste y yo lo registro por ti. Tambien puedo
        responderte como va tu presupuesto.
      </p>
    </div>
  );
}
