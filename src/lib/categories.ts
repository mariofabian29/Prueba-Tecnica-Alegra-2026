/**
 * Taxonomia de gasto de Tripflow.
 * 12 categorias de captura que se agrupan en 4 "buckets" para el resumen del
 * dashboard (Alojamiento, Comida, Actividades, Transporte y otros).
 */

export const CATEGORIES = [
  "FLIGHTS",
  "LODGING",
  "CAR_RENTAL",
  "TRANSPORT",
  "FOOD",
  "DRINKS",
  "SIGHTSEEING",
  "ACTIVITIES",
  "SHOPPING",
  "FUEL",
  "GROCERIES",
  "OTHER",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const BUCKETS = ["LODGING", "FOOD", "ACTIVITIES", "TRANSPORT_OTHER"] as const;
export type Bucket = (typeof BUCKETS)[number];

export const BUCKET_META: Record<Bucket, { label: string; color: string }> = {
  LODGING: { label: "Alojamiento", color: "#e94e8f" },
  FOOD: { label: "Comida", color: "#3fa796" },
  ACTIVITIES: { label: "Actividades", color: "#e4b429" },
  TRANSPORT_OTHER: { label: "Transporte y otros", color: "#2e86ab" },
};

type CategoryMeta = {
  label: string;
  emoji: string;
  color: string;
  bucket: Bucket;
  /** Palabras clave que usa el parser heuristico del chatbot. */
  keywords: string[];
};

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  FLIGHTS: {
    label: "Vuelos",
    emoji: "✈️",
    color: "#2e86ab",
    bucket: "TRANSPORT_OTHER",
    keywords: ["vuelo", "vuelos", "avion", "avión", "aerolinea", "aerolínea", "tiquete aereo", "boarding", "flight"],
  },
  LODGING: {
    label: "Alojamiento",
    emoji: "🛏️",
    color: "#e94e8f",
    bucket: "LODGING",
    keywords: [
      "hotel", "hostal", "hostel", "airbnb", "alojamiento", "hospedaje", "noche",
      "apartamento", "resort", "cabana", "cabaña", "camping", "lodging", "stay",
    ],
  },
  CAR_RENTAL: {
    label: "Alquiler coches",
    emoji: "🚗",
    color: "#7b4b94",
    bucket: "TRANSPORT_OTHER",
    keywords: ["alquiler de auto", "alquiler de coche", "rent a car", "rental", "renta de carro", "carro alquilado"],
  },
  TRANSPORT: {
    label: "Transporte",
    emoji: "🚇",
    color: "#3d7ea6",
    bucket: "TRANSPORT_OTHER",
    keywords: [
      "taxi", "uber", "didi", "cabify", "bus", "autobus", "metro", "tren", "tranvia",
      "tranvía", "peaje", "parqueadero", "parking", "transporte", "traslado", "ferry",
      "bicicleta", "scooter", "train",
    ],
  },
  FOOD: {
    label: "Comida",
    emoji: "🍴",
    color: "#3fa796",
    bucket: "FOOD",
    keywords: [
      "comida", "comi", "almuerzo", "almorce", "desayuno", "cena", "cene", "restaurante",
      "restaurant", "pizza", "hamburguesa", "sushi", "snack", "postre", "helado",
      "brunch", "tapas", "food", "lunch", "dinner", "breakfast", "mariscos",
    ],
  },
  DRINKS: {
    label: "Bebidas",
    emoji: "🍷",
    color: "#b4436b",
    bucket: "FOOD",
    keywords: ["bebida", "bebidas", "cerveza", "vino", "cafe", "café", "bar", "trago", "coctel", "cóctel", "drinks", "beer"],
  },
  SIGHTSEEING: {
    label: "Turismo",
    emoji: "🏛️",
    color: "#c99b2e",
    bucket: "ACTIVITIES",
    keywords: [
      "museo", "tour", "city tour", "guia", "guía", "monumento", "catedral", "castillo",
      "turismo", "excursion", "excursión", "atraccion", "atracción", "entrada", "entradas",
    ],
  },
  ACTIVITIES: {
    label: "Actividades",
    emoji: "🎫",
    color: "#e4b429",
    bucket: "ACTIVITIES",
    keywords: [
      "actividad", "actividades", "concierto", "cine", "show", "espectaculo", "espectáculo",
      "buceo", "snorkel", "spa", "discoteca", "fiesta", "parque", "ticket", "paseo",
    ],
  },
  SHOPPING: {
    label: "Compras",
    emoji: "🛍️",
    color: "#d6247a",
    bucket: "TRANSPORT_OTHER",
    keywords: [
      "compra", "compre", "compré", "souvenir", "recuerdo", "ropa", "zapatos", "regalo",
      "regalos", "tienda", "mall", "artesania", "artesanía", "shopping",
    ],
  },
  FUEL: {
    label: "Gasolina",
    emoji: "⛽",
    color: "#f08a3c",
    bucket: "TRANSPORT_OTHER",
    keywords: ["gasolina", "combustible", "diesel", "tanqueada", "gas station", "fuel"],
  },
  GROCERIES: {
    label: "Comestibles",
    emoji: "🛒",
    color: "#5fa87e",
    bucket: "FOOD",
    keywords: ["supermercado", "mercado", "comestibles", "abarrotes", "groceries", "tienda de barrio", "despensa"],
  },
  OTHER: {
    label: "Otro",
    emoji: "🧾",
    color: "#a08c93",
    bucket: "TRANSPORT_OTHER",
    keywords: [
      "otro", "otros", "varios", "misc", "propina", "tip", "lavanderia", "lavandería",
      "sim", "wifi", "datos", "farmacia", "medicina", "seguro", "salud",
    ],
  },
};

/** Orden en que se muestran en el selector del popup (4 columnas x 3 filas). */
export const CATEGORY_PICKER_ORDER: Category[] = [
  "FLIGHTS", "LODGING", "CAR_RENTAL", "TRANSPORT",
  "FOOD", "DRINKS", "SIGHTSEEING", "ACTIVITIES",
  "SHOPPING", "FUEL", "GROCERIES", "OTHER",
];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function categoryMeta(value: string): CategoryMeta {
  return isCategory(value) ? CATEGORY_META[value] : CATEGORY_META.OTHER;
}

export function bucketOf(value: string): Bucket {
  return categoryMeta(value).bucket;
}
