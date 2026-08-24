
/**
 * Resolución de la foto de un destino contra Wikimedia.
 *
 * Se usa la API pública de MediaWiki, que no necesita clave ni registro. Si la
 * consulta falla —sin red, destino desconocido, tiempo agotado— se devuelve
 * null y la interfaz recurre a su ilustración generada.
 */

const ENDPOINT = "https://es.wikipedia.org/w/api.php";
const TIMEOUT_MS = 4000;
const MIN_WIDTH = 800;

type MediaWikiImage = { source?: string; width?: number; height?: number };
type MediaWikiPage = {
  title?: string;
  index?: number;
  original?: MediaWikiImage;
  thumbnail?: MediaWikiImage;
};
type MediaWikiResponse = { query?: { pages?: Record<string, MediaWikiPage> } };

/** Extrae la mejor imagen de una respuesta de MediaWiki. Exportada para poder probarla. */
export function pickImage(payload: unknown): string | null {
  const pages = (payload as MediaWikiResponse)?.query?.pages;
  if (!pages || typeof pages !== "object") return null;

  // La búsqueda devuelve los resultados con un índice de relevancia.
  const ordered = Object.values(pages).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  for (const page of ordered) {
    const candidate = page.original ?? page.thumbnail;
    const source = candidate?.source;
    if (!source || !/^https:\/\//.test(source)) continue;

    // Descartamos escudos, banderas y logotipos: no representan el lugar.
    if (/\.svg($|\?)/i.test(source)) continue;
    if (/(flag|coat[_ ]of[_ ]arms|escudo|bandera|logo|seal)/i.test(source)) continue;

    // Y las imágenes demasiado pequeñas para un banner.
    if (candidate?.width && candidate.width < MIN_WIDTH) continue;

    return source;
  }

  return null;
}

export function buildQueryUrl(destination: string, country?: string | null): string {
  const search = [destination.trim(), country?.trim()].filter(Boolean).join(" ");
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "1",
    generator: "search",
    gsrsearch: search,
    gsrlimit: "3",
    gsrnamespace: "0",
    prop: "pageimages",
    piprop: "original|thumbnail",
    pithumbsize: "1600",
    origin: "*",
  });
  return `${ENDPOINT}?${params.toString()}`;
}

export async function resolveDestinationPhoto(
  destination: string,
  country?: string | null
): Promise<string | null> {
  if (!destination.trim()) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(buildQueryUrl(destination, country), {
      signal: controller.signal,
      headers: {
        // MediaWiki pide identificar al cliente.
        "User-Agent": "Tripflow/1.0 (control de gastos de viaje)",
        Accept: "application/json",
      },
      // La foto de una ciudad no cambia: se puede cachear con holgura.
      next: { revalidate: 60 * 60 * 24 * 30 },
    });

    if (!response.ok) return null;
    return pickImage(await response.json());
  } catch {
    // Sin red o consulta agotada: la interfaz usa su ilustración generada.
    return null;
  } finally {
    clearTimeout(timer);
  }
}
