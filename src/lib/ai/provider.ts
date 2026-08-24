import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!.trim() });
  }
  return client;
}

type AskOptions = {
  system: string;
  prompt: string;
  maxTokens?: number;
  /** Fuerza al modelo a responder JSON: prellena la respuesta con "{". */
  json?: boolean;
};

/**
 * Llama a Claude y devuelve texto plano. Devuelve null ante cualquier fallo
 * (sin key, red caida, rate limit) para que el llamador use su fallback local.
 */
export async function askClaude({
  system,
  prompt,
  maxTokens = 900,
  json = false,
}: AskOptions): Promise<string | null> {
  if (!aiEnabled()) return null;
  try {
    const response = await getClient().messages.create({
      model: DEFAULT_MODEL,
      max_tokens: maxTokens,
      system,
      messages: json
        ? [
            { role: "user", content: prompt },
            { role: "assistant", content: "{" },
          ]
        : [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!text) return null;
    return json ? `{${text}` : text;
  } catch (error) {
    console.warn("[ai] Claude no disponible, usando motor local:", (error as Error).message);
    return null;
  }
}

/** Extrae el primer objeto JSON valido de una respuesta del modelo. */
export function parseJsonLoose<T>(raw: string | null): T | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
