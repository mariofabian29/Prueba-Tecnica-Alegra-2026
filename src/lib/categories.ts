export const CATEGORIES = [
  "FOOD",
  "LODGING",
  "TRANSPORT",
  "ENTERTAINMENT",
  "SHOPPING",
  "HEALTH",
  "OTHER",
] as const;

export type Category = (typeof CATEGORIES)[number];

type CategoryMeta = {
  label: string;
  emoji: string;
  color: string;
  /** Palabras clave que usa el parser heuristico del chatbot. */
  keywords: string[];
};

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  FOOD: {
    label: "Comida",
    emoji: "🍽️",
    color: "#F97316",
    keywords: [
      "comida", "comi", "almuerzo", "almorce", "desayuno", "cena", "cene",
      "restaurante", "restaurant", "cafe", "café", "bar", "cerveza", "pizza",
      "hamburguesa", "sushi", "mercado", "supermercado", "snack", "postre",
      "helado", "brunch", "tapas", "food", "lunch", "dinner", "breakfast",
    ],
  },
  LODGING: {
    label: "Alojamiento",
    emoji: "🏨",
    color: "#6366F1",
    keywords: [
      "hotel", "hostal", "hostel", "airbnb", "alojamiento", "hospedaje",
      "noche de hotel", "apartamento", "resort", "cabana", "cabaña", "camping",
      "lodging", "stay",
    ],
  },
  TRANSPORT: {
    label: "Transporte",
    emoji: "🚕",
    color: "#0EA5E9",
    keywords: [
      "taxi", "uber", "didi", "cabify", "bus", "autobus", "metro", "tren",
      "vuelo", "avion", "avión", "aerolinea", "aerolínea", "gasolina",
      "combustible", "peaje", "parqueadero", "parking", "alquiler de auto",
      "rental", "transporte", "traslado", "ferry", "bicicleta", "scooter",
      "flight", "train", "gas",
    ],
  },
  ENTERTAINMENT: {
    label: "Entretenimiento",
    emoji: "🎟️",
    color: "#A855F7",
    keywords: [
      "tour", "museo", "entrada", "entradas", "ticket", "concierto", "cine",
      "excursion", "excursión", "paseo", "parque", "show", "espectaculo",
      "espectáculo", "buceo", "snorkel", "spa", "discoteca", "fiesta",
      "entretenimiento", "atraccion", "atracción", "guia", "guía",
    ],
  },
  SHOPPING: {
    label: "Compras",
    emoji: "🛍️",
    color: "#EC4899",
    keywords: [
      "compra", "compre", "compré", "souvenir", "recuerdo", "ropa", "zapatos",
      "regalo", "regalos", "tienda", "mall", "artesania", "artesanía",
      "shopping", "electronica", "electrónica",
    ],
  },
  HEALTH: {
    label: "Salud",
    emoji: "💊",
    color: "#10B981",
    keywords: [
      "farmacia", "medicina", "medicamento", "doctor", "medico", "médico",
      "hospital", "clinica", "clínica", "seguro", "vacuna", "salud",
      "pharmacy", "insurance",
    ],
  },
  OTHER: {
    label: "Otros",
    emoji: "📦",
    color: "#64748B",
    keywords: ["otro", "otros", "varios", "misc", "propina", "tip", "lavanderia", "lavandería", "sim", "wifi", "datos"],
  },
};

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function categoryMeta(value: string): CategoryMeta {
  return isCategory(value) ? CATEGORY_META[value] : CATEGORY_META.OTHER;
}
