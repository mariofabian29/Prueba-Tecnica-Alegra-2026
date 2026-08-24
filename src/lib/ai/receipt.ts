import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES, isCategory, type Category } from "@/lib/categories";
import { toDateInput } from "@/lib/format";
import { aiEnabled, parseJsonLoose } from "@/lib/ai/provider";

export type ReceiptDraft = {
  amount: number | null;
  category: Category;
  description: string;
  date: string;
  /** true cuando el modelo pudo leer el recibo; false si hay que pedir los datos. */
  extracted: boolean;
};

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type ReceiptMediaType = (typeof MEDIA_TYPES)[number];

export function isSupportedMediaType(value: string): value is ReceiptMediaType {
  return (MEDIA_TYPES as readonly string[]).includes(value);
}

const SYSTEM = `Extraes datos de fotos de recibos y facturas de viaje. Respondes SOLO con un objeto JSON valido.

Formato:
{"amount": number, "description": string, "category": "UNA_CATEGORIA", "date": "YYYY-MM-DD", "confidence": "high"|"low"}

Reglas:
- "amount" es el TOTAL final pagado (incluye propina e impuestos si aparecen en el total). Solo el numero, sin simbolos ni separadores de miles.
- "description" es corta y util: normalmente el nombre del comercio y que se consumio (ej: "Comida en Chuzales Cartagena").
- "date" es la fecha impresa en el recibo. Si no se ve, usa la fecha de hoy que te indican.
- "confidence" es "low" si la imagen no es un recibo o no logras leer el total.

Categorias validas: ${CATEGORIES.join(", ")}`;

/**
 * Lee un recibo con Claude. Si no hay API key o la lectura falla, devuelve un
 * borrador vacio para que la persona complete el monto a mano.
 */
export async function readReceipt(
  base64: string,
  mediaType: ReceiptMediaType,
  currency: string
): Promise<ReceiptDraft> {
  const today = toDateInput(new Date());
  const empty: ReceiptDraft = {
    amount: null,
    category: "OTHER",
    description: "Gasto del recibo",
    date: today,
    extracted: false,
  };

  if (!aiEnabled()) return empty;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!.trim() });
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 500,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            {
              type: "text",
              text: `Extrae los datos de este recibo. La moneda del viaje es ${currency} y hoy es ${today}.`,
            },
          ],
        },
        { role: "assistant", content: "{" },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const parsed = parseJsonLoose<{
      amount?: number;
      description?: string;
      category?: string;
      date?: string;
      confidence?: string;
    }>(`{${text}`);

    const amount = Number(parsed?.amount);
    if (!parsed || !Number.isFinite(amount) || amount <= 0 || parsed.confidence === "low") {
      return empty;
    }

    return {
      amount: Math.round(amount * 100) / 100,
      category: isCategory(String(parsed.category)) ? (parsed.category as Category) : "OTHER",
      description: (parsed.description || "Gasto del recibo").slice(0, 120),
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(parsed.date)) ? String(parsed.date) : today,
      extracted: true,
    };
  } catch (error) {
    console.warn("[ai] no se pudo leer el recibo:", (error as Error).message);
    return empty;
  }
}
