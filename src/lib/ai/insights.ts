import "server-only";
import type { TripAnalytics, TripLike } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { askClaude, aiEnabled, parseJsonLoose } from "@/lib/ai/provider";

export type Insight = {
  /** tip | warning | danger | success */
  tone: "tip" | "warning" | "danger" | "success";
  title: string;
  detail: string;
};

export type InsightsResult = {
  headline: string;
  summary: string;
  health: TripAnalytics["health"];
  insights: Insight[];
  /** "claude" cuando lo genero el modelo, "local" cuando fue el motor heuristico. */
  engine: "claude" | "local";
  generatedAt: string;
};

const SYSTEM_PROMPT = `Eres un asesor financiero de viajes. Analizas el presupuesto de un viaje en curso y das recomendaciones economicas concretas, accionables y en espanol neutro.

Reglas:
- Sé directo y especifico: usa las cifras reales que te den, nunca inventes datos.
- Nada de moralizar ni de frases genericas tipo "controla tus gastos".
- Cada recomendacion debe poder ejecutarse hoy mismo (ej: "baja a 45 USD/dia en comida: son 2 almuerzos de calle en vez de restaurante").
- Maximo 4 insights.
- Responde SOLO JSON valido con esta forma:
{"headline": string (max 60 chars), "summary": string (max 220 chars, 1-2 frases sobre como va el viaje), "insights": [{"tone": "tip"|"warning"|"danger"|"success", "title": string (max 50 chars), "detail": string (max 180 chars)}]}`;

function buildPrompt(trip: TripLike, a: TripAnalytics): string {
  const cat = a.byCategory
    .map((c) => `  - ${c.label}: ${formatMoney(c.total, a.currency)} (${c.share.toFixed(0)}% del gasto, ${c.count} registros)`)
    .join("\n") || "  (aun sin gastos)";

  const people = a.byPerson.map((p) => `  - ${p.name}: ${formatMoney(p.total, a.currency)}`).join("\n") || "  (n/a)";

  const statusLabel =
    a.status === "NOT_STARTED" ? "aun no comienza" : a.status === "FINISHED" ? "ya termino" : "en curso";

  return `Datos del viaje:
- Destino: ${trip.destination}${trip.country ? `, ${trip.country}` : ""}
- Estado: ${statusLabel}
- Acompanantes: ${trip.companions.length > 0 ? trip.companions.map((c) => c.name).join(", ") : "viaja solo"}
- Duracion: ${a.totalDays} dias (dia ${a.elapsedDays} de ${a.totalDays}, quedan ${a.daysLeft} dias)
- Presupuesto: ${formatMoney(a.budget, a.currency)}
- Gastado: ${formatMoney(a.totalSpent, a.currency)} (${a.usedPct.toFixed(1)}%)
- Disponible: ${formatMoney(a.remaining, a.currency)}
- Presupuesto diario planificado: ${formatMoney(a.plannedDailyBudget, a.currency)}
- Gasto promedio real por dia: ${formatMoney(a.avgPerDay, a.currency)}
- Cuanto puede gastar por dia con lo que queda: ${formatMoney(a.safeDailyBudget, a.currency)}
- Desvio de ritmo vs. plan: ${a.paceDelta >= 0 ? "+" : ""}${formatMoney(a.paceDelta, a.currency)}
- Proyeccion de gasto total al ritmo actual: ${formatMoney(a.projectedTotal, a.currency)}${a.projectedOverrun > 0 ? ` (se pasaria por ${formatMoney(a.projectedOverrun, a.currency)})` : ""}
- Gasto mas alto: ${a.biggestExpense ? `${a.biggestExpense.description} por ${formatMoney(a.biggestExpense.amount, a.currency)}` : "n/a"}

Gasto por categoria:
${cat}

Gasto por persona:
${people}

Genera el analisis en JSON.`;
}

export async function generateInsights(trip: TripLike, a: TripAnalytics): Promise<InsightsResult> {
  const local = localInsights(trip, a);

  if (!aiEnabled()) return local;

  const raw = await askClaude({
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(trip, a),
    maxTokens: 900,
    json: true,
  });

  const parsed = parseJsonLoose<{ headline?: string; summary?: string; insights?: Insight[] }>(raw);
  if (!parsed?.summary || !Array.isArray(parsed.insights) || parsed.insights.length === 0) {
    return local;
  }

  const validTones = new Set(["tip", "warning", "danger", "success"]);
  const insights = parsed.insights
    .filter((i) => i && typeof i.title === "string" && typeof i.detail === "string")
    .slice(0, 4)
    .map((i) => ({
      tone: validTones.has(i.tone) ? i.tone : ("tip" as const),
      title: String(i.title).slice(0, 80),
      detail: String(i.detail).slice(0, 240),
    }));

  if (insights.length === 0) return local;

  return {
    headline: (parsed.headline || local.headline).slice(0, 80),
    summary: parsed.summary.slice(0, 300),
    health: a.health,
    insights,
    engine: "claude",
    generatedAt: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*  Motor heuristico local: siempre disponible, sin dependencias externas.     */
/* -------------------------------------------------------------------------- */

export function localInsights(trip: TripLike, a: TripAnalytics): InsightsResult {
  const m = (n: number) => formatMoney(n, a.currency);
  const insights: Insight[] = [];

  // 1. Ritmo de gasto
  if (a.status === "NOT_STARTED") {
    insights.push({
      tone: "tip",
      title: "Tu viaje aun no empieza",
      detail: `Tienes ${m(a.budget)} para ${a.totalDays} dias: ${m(a.plannedDailyBudget)} por dia. Reserva alojamiento y transporte ahora para fijar los costos mas grandes.`,
    });
  } else if (a.totalSpent > a.budget) {
    insights.push({
      tone: "danger",
      title: "Presupuesto excedido",
      detail: `Vas ${m(a.totalSpent - a.budget)} por encima del limite. Congela gastos no esenciales y prioriza comida de mercado y transporte publico el resto del viaje.`,
    });
  } else if (a.projectedOverrun > 0) {
    insights.push({
      tone: "warning",
      title: `Al ritmo actual te pasarias por ${m(a.projectedOverrun)}`,
      detail: `Gastas ${m(a.avgPerDay)}/dia y solo te alcanza para ${m(a.safeDailyBudget)}/dia. Recorta ${m(Math.max(0, a.avgPerDay - a.safeDailyBudget))} diarios para llegar justo.`,
    });
  } else if (a.paceDelta < 0) {
    insights.push({
      tone: "success",
      title: `Vas ${m(Math.abs(a.paceDelta))} por debajo del plan`,
      detail: `Con ${m(a.remaining)} para ${a.daysLeft} dias puedes gastar hasta ${m(a.safeDailyBudget)} diarios. Tienes margen para una actividad extra sin romper el presupuesto.`,
    });
  } else {
    insights.push({
      tone: "success",
      title: "Vas en linea con el plan",
      detail: `Llevas ${a.usedPct.toFixed(0)}% del presupuesto en el dia ${a.elapsedDays} de ${a.totalDays}. Manten el ritmo de ${m(a.safeDailyBudget)} por dia.`,
    });
  }

  // 2. Categoria dominante
  if (a.topCategory && a.topCategory.share >= 35) {
    const c = a.topCategory;
    const tips: Record<string, string> = {
      FOOD: "Cambia una comida en restaurante por mercado local o almuerzo del dia: suele costar la mitad.",
      LODGING: "Si aun quedan noches por reservar, mira opciones a 15-20 min del centro: bajan 30% en promedio.",
      TRANSPORT: "Compra un pase de transporte de varios dias o combina caminata para trayectos cortos.",
      ENTERTAINMENT: "Busca city pass o dias de entrada gratuita a museos; ahorras entre 20% y 40%.",
      SHOPPING: "Deja los souvenirs para el ultimo dia y con un tope fijo; evita compras impulsivas.",
      HEALTH: "Revisa si tu seguro de viaje reembolsa estos gastos antes de volver.",
      OTHER: "Revisa los gastos sin categoria clara: suelen esconder fugas pequenas y repetidas.",
    };
    insights.push({
      tone: c.share >= 55 ? "warning" : "tip",
      title: `${c.emoji} ${c.label} concentra el ${c.share.toFixed(0)}% del gasto`,
      detail: `${m(c.total)} en ${c.count} registros. ${tips[c.category] ?? tips.OTHER}`,
    });
  }

  // 3. Gasto atipico
  if (a.biggestExpense && a.totalSpent > 0) {
    const share = (a.biggestExpense.amount / a.totalSpent) * 100;
    if (share >= 25 && a.expenseCount >= 3) {
      insights.push({
        tone: "tip",
        title: "Un solo gasto pesa demasiado",
        detail: `"${a.biggestExpense.description}" (${m(a.biggestExpense.amount)}) es el ${share.toFixed(0)}% de todo lo gastado. Si era puntual, tu ritmo real es mas bajo de lo que parece.`,
      });
    }
  }

  // 4. Reparto entre acompanantes
  if (trip.companions.length > 0 && a.byPerson.length > 1) {
    const top = a.byPerson[0];
    const fairShare = 100 / (trip.companions.length + 1);
    if (top.share > fairShare * 1.5) {
      insights.push({
        tone: "tip",
        title: "Los pagos estan desbalanceados",
        detail: `${top.name} ha puesto el ${top.share.toFixed(0)}% (${m(top.total)}) frente a un reparto parejo de ${fairShare.toFixed(0)}%. Buen momento para cuadrar cuentas del grupo.`,
      });
    }
  }

  // 5. Sin gastos todavia
  if (a.expenseCount === 0 && a.status !== "NOT_STARTED") {
    insights.push({
      tone: "tip",
      title: "Aun no registras gastos",
      detail: "Registra el primero de forma manual o escribiendole al chat: \"gaste 25 en el almuerzo\". El panel se actualiza al instante.",
    });
  }

  const headline =
    a.status === "NOT_STARTED"
      ? "Todo listo para arrancar"
      : a.health === "over_budget"
        ? "Necesitas frenar el gasto"
        : a.health === "warning"
          ? "Cuidado con el ritmo"
          : "Tu viaje va bien encaminado";

  const summary =
    a.expenseCount === 0
      ? `Tienes ${m(a.budget)} para ${a.totalDays} dias en ${trip.destination}. Eso es ${m(a.plannedDailyBudget)} por dia.`
      : `Llevas ${m(a.totalSpent)} de ${m(a.budget)} (${a.usedPct.toFixed(0)}%) en el dia ${a.elapsedDays} de ${a.totalDays}. ` +
        (a.daysLeft > 0
          ? `Te quedan ${m(a.remaining)} para ${a.daysLeft} dias, es decir ${m(a.safeDailyBudget)} diarios.`
          : `El viaje termino con ${a.remaining >= 0 ? `${m(a.remaining)} sin usar` : `${m(Math.abs(a.remaining))} de sobrecosto`}.`);

  return {
    headline,
    summary,
    health: a.health,
    insights: insights.slice(0, 4),
    engine: "local",
    generatedAt: new Date().toISOString(),
  };
}
