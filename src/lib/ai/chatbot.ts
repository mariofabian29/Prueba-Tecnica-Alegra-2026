import "server-only";
import { CATEGORIES, CATEGORY_META, isCategory, type Category } from "@/lib/categories";
import { formatMoney, startOfDay, toDateInput } from "@/lib/format";
import type { TripAnalytics, TripLike } from "@/lib/analytics";
import { askClaude, aiEnabled, parseJsonLoose } from "@/lib/ai/provider";

export type ParsedExpense = {
  amount: number;
  category: Category;
  description: string;
  /** YYYY-MM-DD */
  date: string;
  paidBy: string;
};

export type ChatResult =
  | { intent: "add_expense"; reply: string; expense: ParsedExpense; engine: "claude" | "local" }
  | { intent: "answer"; reply: string; engine: "claude" | "local" }
  | { intent: "upload_receipt"; reply: string; engine: "claude" | "local" }
  | { intent: "clarify"; reply: string; engine: "claude" | "local" };

/* -------------------------------------------------------------------------- */
/*  Claude                                                                     */
/* -------------------------------------------------------------------------- */

function systemPrompt(trip: TripLike, a: TripAnalytics, today: string): string {
  const people = ["Yo", ...trip.companions.map((c) => c.name)];
  return `Eres el asistente de gastos del viaje a ${trip.destination}. El usuario te escribe en lenguaje natural (espanol o ingles) y tu trabajo es (a) registrar gastos o (b) responder preguntas sobre el presupuesto.

CONTEXTO DEL VIAJE (usa estas cifras, no inventes otras):
- Moneda: ${a.currency}
- Presupuesto: ${formatMoney(a.budget, a.currency)} | Gastado: ${formatMoney(a.totalSpent, a.currency)} | Disponible: ${formatMoney(a.remaining, a.currency)}
- Dia ${a.elapsedDays} de ${a.totalDays}, quedan ${a.daysLeft} dias
- Puede gastar ${formatMoney(a.safeDailyBudget, a.currency)} por dia con lo que le queda
- Promedio real: ${formatMoney(a.avgPerDay, a.currency)}/dia
- Por categoría: ${a.byCategory.map((c) => `${c.label} ${formatMoney(c.total, a.currency)}`).join(", ") || "sin gastos aún"}
- Fecha de hoy: ${today}
- Personas que pueden pagar: ${people.join(", ")}

CATEGORIAS VALIDAS: ${CATEGORIES.join(", ")}
(${Object.entries(CATEGORY_META).map(([k, v]) => `${k}=${v.label}`).join(", ")})

Responde SIEMPRE con un unico objeto JSON valido, sin texto alrededor:

1) Si el mensaje describe un gasto:
{"intent":"add_expense","reply":"confirmacion breve y util en 1-2 frases, menciona cuanto le queda","expense":{"amount":number,"category":"UNA_DE_LAS_VALIDAS","description":"texto corto y claro","date":"YYYY-MM-DD","paidBy":"nombre de la lista de personas"}}

2) Si es una pregunta sobre el presupuesto o pide consejo:
{"intent":"answer","reply":"respuesta directa con cifras reales, max 3 frases"}

3) Si pide subir/cargar una factura, recibo o foto:
{"intent":"upload_receipt","reply":"Toca para abrir la cámara o elegir tu foto de la galería."}

4) Si falta el monto o no se entiende:
{"intent":"clarify","reply":"pregunta concreta por lo que falta, ej: ¿Que comida fue? ¿Cuanto te costo?"}

Reglas: interpreta fechas relativas ("hoy", "ayer", "el lunes") respecto a ${today}. Si no dice quien pago, usa "Yo". El monto siempre positivo y en ${a.currency}. Sé breve y concreto, nada de moralizar.`;
}

export async function runChatbot(
  message: string,
  trip: TripLike,
  analytics: TripAnalytics,
  history: { role: string; content: string }[] = []
): Promise<ChatResult> {
  const today = toDateInput(new Date());

  if (aiEnabled()) {
    const context = history
      .slice(-6)
      .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
      .join("\n");

    const raw = await askClaude({
      system: systemPrompt(trip, analytics, today),
      prompt: context ? `Conversacion previa:\n${context}\n\nUsuario: ${message}` : `Usuario: ${message}`,
      maxTokens: 600,
      json: true,
    });

    const parsed = parseJsonLoose<{ intent?: string; reply?: string; expense?: Partial<ParsedExpense> }>(raw);
    const normalized = normalizeClaudeResult(parsed, trip, analytics, today);
    if (normalized) return normalized;
  }

  return localChatbot(message, trip, analytics, today);
}

function normalizeClaudeResult(
  parsed: { intent?: string; reply?: string; expense?: Partial<ParsedExpense> } | null,
  trip: TripLike,
  a: TripAnalytics,
  today: string
): ChatResult | null {
  if (!parsed?.reply || typeof parsed.reply !== "string") return null;
  const reply = parsed.reply.trim().slice(0, 500);

  if (parsed.intent === "add_expense") {
    const e = parsed.expense;
    const amount = Number(e?.amount);
    if (!e || !Number.isFinite(amount) || amount <= 0) return null;

    const category: Category = isCategory(String(e.category)) ? (e.category as Category) : guessCategory(String(e.description ?? ""));
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(e.date)) ? String(e.date) : today;
    const paidBy = resolvePayer(String(e.paidBy ?? ""), trip);

    return {
      intent: "add_expense",
      engine: "claude",
      reply,
      expense: {
        amount: Math.round(amount * 100) / 100,
        category,
        description: (String(e.description ?? "").trim() || CATEGORY_META[category].label).slice(0, 120),
        date,
        paidBy,
      },
    };
  }

  if (parsed.intent === "answer") return { intent: "answer", reply, engine: "claude" };
  if (parsed.intent === "upload_receipt") return { intent: "upload_receipt", reply, engine: "claude" };
  if (parsed.intent === "clarify") return { intent: "clarify", reply, engine: "claude" };
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Motor local: parser deterministico (sin API key)                           */
/* -------------------------------------------------------------------------- */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function guessCategory(text: string): Category {
  const t = normalize(text);
  let best: Category = "OTHER";
  let bestScore = 0;
  for (const category of CATEGORIES) {
    for (const keyword of CATEGORY_META[category].keywords) {
      const k = normalize(keyword);
      if (t.includes(k) && k.length > bestScore) {
        bestScore = k.length;
        best = category;
      }
    }
  }
  return best;
}

/** Extrae el primer monto del texto soportando 1.250,50 / 1,250.50 / 45k / 45 mil. */
export function extractAmount(text: string): number | null {
  const t = normalize(text);

  const kMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(k|mil)\b/);
  if (kMatch) {
    const base = Number(kMatch[1].replace(",", "."));
    if (Number.isFinite(base)) return base * 1000;
  }

  const matches = t.match(/\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?/g);
  if (!matches) return null;

  for (const raw of matches) {
    const value = parseNumeric(raw);
    if (value !== null && value > 0) return value;
  }
  return null;
}

function parseNumeric(raw: string): number | null {
  let s = raw;
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");

  if (hasDot && hasComma) {
    // El ultimo separador es el decimal
    s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (hasComma) {
    // "1,250" -> miles ; "12,50" -> decimal
    s = /,\d{3}\b/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (hasDot) {
    if (/\.\d{3}\b/.test(s) && !/\.\d{1,2}$/.test(s)) s = s.replace(/\./g, "");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const WEEKDAYS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

export function extractDate(text: string, today: Date): string {
  const t = normalize(text);

  const explicit = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (explicit) return explicit[0];

  const dmy = t.match(/\b(\d{1,2})[/](\d{1,2})(?:[/](\d{2,4}))?\b/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    const year = dmy[3] ? Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]) : today.getFullYear();
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) return toDateInput(d);
  }

  if (/\banteayer\b|\bantier\b/.test(t)) return shiftDays(today, -2);
  if (/\bayer\b|\banoche\b/.test(t)) return shiftDays(today, -1);
  if (/\bhoy\b|\bahora\b|\brecien\b/.test(t)) return toDateInput(today);

  const hace = t.match(/\bhace\s+(\d+)\s+dias?\b/);
  if (hace) return shiftDays(today, -Number(hace[1]));

  const weekday = WEEKDAYS.findIndex((d) => new RegExp(`\\b(el\\s+)?${d}\\b`).test(t));
  if (weekday >= 0) {
    const diff = (today.getDay() - weekday + 7) % 7 || 7;
    return shiftDays(today, -diff);
  }

  return toDateInput(today);
}

function shiftDays(base: Date, delta: number): string {
  const d = startOfDay(base);
  d.setDate(d.getDate() + delta);
  return toDateInput(d);
}

function resolvePayer(candidate: string, trip: TripLike): string {
  const c = normalize(candidate).trim();
  if (!c || c === "yo" || c === "me" || c === "i") return "Yo";
  const match = trip.companions.find((p) => normalize(p.name) === c || normalize(p.name).split(" ")[0] === c);
  return match?.name ?? "Yo";
}

function detectPayer(text: string, trip: TripLike): string {
  const t = normalize(text);
  for (const companion of trip.companions) {
    const first = normalize(companion.name).split(" ")[0];
    if (new RegExp(`\\b${escapeRegex(first)}\\b`).test(t)) return companion.name;
  }
  return "Yo";
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildDescription(text: string, category: Category): string {
  const cleaned = text
    .replace(/\b(gaste|gasté|pague|pagué|compre|compré|registra|anota|apunta|añade|agrega|add|spent|paid|fueron|fue|son|costo|costó|salio|salió|me|nos|y)\b/gi, "")
    .replace(/\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s*(k|mil)?/gi, "")
    .replace(/\b(usd|eur|cop|mxn|ars|brl|clp|pen|gbp|dolares|dólares|euros|pesos|soles|reales)\b/gi, "")
    .replace(/\b(en|de|del|el|la|los|las|un|una|por|para|hoy|ayer|anoche|anteayer|antier|ahora|con|al|a)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length >= 3) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1, 120);
  }
  return CATEGORY_META[category].label;
}

const QUESTION_HINTS =
  /\b(cuanto|cuánto|como voy|cómo voy|queda|quedan|puedo gastar|resumen|balance|recomend\w*|consejo\w*|sugerencia\w*|alcanza|voy bien|me paso|me pase)\b/i;

const GREETING = /^\s*(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|hi|hello|que tal|qué tal|holi)\b/i;

const RECEIPT_INTENT =
  /\b(factura|recibo|ticket|tirilla|comprobante|foto del? (recibo|factura)|cargar la factura|subir (el |la )?(recibo|factura|foto))\b/i;

export function localChatbot(
  message: string,
  trip: TripLike,
  a: TripAnalytics,
  today: string
): ChatResult {
  const m = (n: number) => formatMoney(n, a.currency);
  const t = normalize(message);
  const amount = extractAmount(message);
  const looksLikeQuestion = message.includes("?") || QUESTION_HINTS.test(t);

  // Peticion explicita de subir una factura.
  if (RECEIPT_INTENT.test(t) && amount === null) {
    return {
      intent: "upload_receipt",
      engine: "local",
      reply: "Toca para abrir la cámara o elegir tu foto de la galería.",
    };
  }

  // Saludo sin datos: presentamos las dos vias de uso.
  if (GREETING.test(message) && amount === null && !QUESTION_HINTS.test(t)) {
    return {
      intent: "answer",
      engine: "local",
      reply: `Hola. Soy tu asistente de gastos del viaje a ${trip.destination}. Dime cuánto gastaste (por ejemplo "gasté 32 en el almuerzo") y lo registro, o pregúntame cómo va tu presupuesto.`,
    };
  }

  // Pregunta sobre el estado del presupuesto
  if (looksLikeQuestion && (amount === null || /\bcuanto\b/.test(t))) {
    if (/recomend|consejo|que hago|qué hago/.test(t)) {
      const advice =
        a.remaining < 0
          ? `Ya superaste el presupuesto en ${m(Math.abs(a.remaining))}. Para los ${a.daysLeft} días que faltan, limita el gasto a lo esencial: comida de mercado y transporte público.`
          : a.projectedOverrun > 0
            ? `Al ritmo de ${m(a.avgPerDay)}/día te pasarías por ${m(a.projectedOverrun)}. Bajar a ${m(a.safeDailyBudget)} diarios te deja justo en el presupuesto.`
            : `Vas bien: puedes gastar hasta ${m(a.safeDailyBudget)} por día durante los ${a.daysLeft} días que quedan.`;
      const top = a.topCategory ? ` Tu mayor gasto es ${a.topCategory.label} con ${m(a.topCategory.total)} (${a.topCategory.share.toFixed(0)}%).` : "";
      return { intent: "answer", engine: "local", reply: advice + top };
    }
    if (/queda|disponible|resta/.test(t)) {
      return {
        intent: "answer",
        engine: "local",
        reply:
          a.remaining < 0
            ? `Ya no te queda presupuesto: vas ${m(Math.abs(a.remaining))} por encima de los ${m(a.budget)} previstos. Cada gasto nuevo aumenta el sobrecosto.`
            : `Te quedan ${m(a.remaining)} de ${m(a.budget)}. Para los ${a.daysLeft} días restantes son ${m(a.safeDailyBudget)} por día.`,
      };
    }
    return {
      intent: "answer",
      engine: "local",
      reply:
        `Llevas ${m(a.totalSpent)} gastados (${a.usedPct.toFixed(0)}% del presupuesto) en ${a.expenseCount} registros, con un promedio de ${m(a.avgPerDay)} por día. ` +
        (a.remaining < 0
          ? `Estás ${m(Math.abs(a.remaining))} por encima del límite.`
          : `Te quedan ${m(a.remaining)}.`),
    };
  }

  // Registro de gasto
  if (amount !== null && amount > 0) {
    const category = guessCategory(message);
    const expense: ParsedExpense = {
      amount: Math.round(amount * 100) / 100,
      category,
      description: buildDescription(message, category),
      date: extractDate(message, new Date(`${today}T12:00:00`)),
      paidBy: detectPayer(message, trip),
    };

    const newRemaining = a.remaining - expense.amount;
    const tail =
      newRemaining < 0
        ? `Ojo: te pasaste del presupuesto por ${m(Math.abs(newRemaining))}.`
        : `Te quedan ${m(newRemaining)}.`;

    return {
      intent: "add_expense",
      engine: "local",
      reply: `Listo, registré ${m(expense.amount)} en ${CATEGORY_META[category].label.toLowerCase()} (${expense.description}). ${tail}`,
      expense,
    };
  }

  // Menciono una categoría pero no un monto: pedimos el dato que falta.
  const hinted = guessCategory(message);
  if (hinted !== "OTHER") {
    const label = CATEGORY_META[hinted].label.toLowerCase();
    return {
      intent: "clarify",
      engine: "local",
      reply: `¿Qué ${label} fue? ¿Cuánto te costó?`,
    };
  }

  return {
    intent: "clarify",
    engine: "local",
    reply:
      'No detecté un monto en tu mensaje. Escríbeme algo como "gasté 45 en el almuerzo", o toca "Quiero cargar la factura" para subir una foto del recibo.',
  };
}
