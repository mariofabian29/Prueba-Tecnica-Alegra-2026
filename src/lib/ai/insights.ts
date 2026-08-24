import "server-only";
import type { TripAnalytics, TripLike } from "@/lib/analytics";
import { BUCKET_META, type Bucket } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import { askClaude, aiEnabled, parseJsonLoose } from "@/lib/ai/provider";

export type Insight = {
  /** tip | warning | danger | success */
  tone: "tip" | "warning" | "danger" | "success";
  title: string;
  detail: string;
};

/** Fila del panel lateral: una categoría y como va frente a lo esperado. */
export type BucketSignal = {
  bucket: Bucket;
  label: string;
  emoji: string;
  status: "over" | "within" | "under";
  /** Texto corto que se muestra a la derecha: "+12%", "dentro del límite", "-8%". */
  detail: string;
};

export type InsightsResult = {
  headline: string;
  summary: string;
  /** Texto de la caja "Impulsado por IA". */
  narrative: string;
  health: TripAnalytics["health"];
  signals: BucketSignal[];
  insights: Insight[];
  /** "claude" cuando lo genero el modelo, "local" cuando fue el motor heuristico. */
  engine: "claude" | "local";
  generatedAt: string;
};

const BUCKET_EMOJI: Record<Bucket, string> = {
  LODGING: "🏨",
  FOOD: "🍽️",
  ACTIVITIES: "🎫",
  TRANSPORT_OTHER: "🚕",
};

/**
 * Reparto de referencia de un viaje tipico. Sirve para decir si una categoría
 * va por encima o por debajo de lo esperado cuando el viaje no define
 * sub-presupuestos por categoría.
 */
const REFERENCE_MIX: Record<Bucket, number> = {
  LODGING: 0.35,
  FOOD: 0.3,
  ACTIVITIES: 0.2,
  TRANSPORT_OTHER: 0.15,
};

const TOLERANCE = 5; // puntos porcentuales

export function computeSignals(a: TripAnalytics): BucketSignal[] {
  if (a.totalSpent <= 0) return [];

  return a.byBucket
    .filter((b) => b.total > 0 || REFERENCE_MIX[b.bucket] >= 0.3)
    .map((b) => {
      // Sin gastos no hay desviacion que reportar: un "-100%" seria enganoso.
      if (b.total === 0) {
        return {
          bucket: b.bucket,
          label: b.label,
          emoji: BUCKET_EMOJI[b.bucket],
          status: "within" as const,
          detail: "sin registrar",
        };
      }

      const expected = a.totalSpent * REFERENCE_MIX[b.bucket];
      const deltaPct = expected > 0 ? ((b.total - expected) / expected) * 100 : 0;
      const status: BucketSignal["status"] =
        Math.abs(deltaPct) <= TOLERANCE ? "within" : deltaPct > 0 ? "over" : "under";

      return {
        bucket: b.bucket,
        label: b.label,
        emoji: BUCKET_EMOJI[b.bucket],
        status,
        detail:
          status === "within"
            ? "dentro del límite"
            : `${deltaPct > 0 ? "+" : "−"}${Math.min(999, Math.abs(Math.round(deltaPct)))}%`,
      };
    })
    .sort((x, y) => (x.status === "within" ? 1 : 0) - (y.status === "within" ? 1 : 0))
    .slice(0, 4);
}

/* -------------------------------------------------------------------------- */
/*  Claude                                                                     */
/* -------------------------------------------------------------------------- */

const SYSTEM_PROMPT = `Eres el asesor financiero de viajes de Tripflow. Analizas el presupuesto de un viaje y das recomendaciones economicas concretas y accionables, en español neutro.

Reglas:
- Usa unicamente las cifras reales que te dan, nunca inventes datos.
- Nada de moralizar ni frases genericas tipo "controla tus gastos".
- Cada recomendacion debe poder ejecutarse hoy mismo (ej: "baja a 45 USD/día en comida: son 2 almuerzos de calle en vez de restaurante").
- Máximo 4 insights.
- Responde SOLO JSON valido con esta forma:
{"headline": string (max 40 chars, ej "Vas bien" o "Cuidado con el ritmo"), "summary": string (max 200 chars), "narrative": string (max 190 chars, una alerta o felicitacion concreta para el panel lateral), "insights": [{"tone": "tip"|"warning"|"danger"|"success", "title": string (max 50 chars), "detail": string (max 180 chars)}]}`;

function buildPrompt(trip: TripLike, a: TripAnalytics): string {
  const buckets =
    a.byBucket
      .map((b) => `  - ${b.label}: ${formatMoney(b.total, a.currency)} (${b.share.toFixed(0)}% del gasto)`)
      .join("\n") || "  (aún sin gastos)";

  const detail =
    a.byCategory
      .map((c) => `  - ${c.label}: ${formatMoney(c.total, a.currency)} en ${c.count} registros`)
      .join("\n") || "  (aún sin gastos)";

  const statusLabel =
    a.status === "NOT_STARTED" ? "aún no comienza" : a.status === "FINISHED" ? "ya terminó" : "en curso";

  return `Datos del viaje:
- Destino: ${trip.destination}${trip.country ? `, ${trip.country}` : ""}
- Estado: ${statusLabel}
- Acompañantes: ${trip.companions.length > 0 ? trip.companions.map((c) => c.name).join(", ") : "viaja solo"}
- Duracion: ${a.totalDays} días (día ${a.elapsedDays} de ${a.totalDays}, quedan ${a.daysLeft})
- Presupuesto: ${formatMoney(a.budget, a.currency)}
- Gastado: ${formatMoney(a.totalSpent, a.currency)} (${a.usedPct.toFixed(1)}%)
- Disponible: ${formatMoney(a.remaining, a.currency)}
- Presupuesto diario planificado: ${formatMoney(a.plannedDailyBudget, a.currency)}
- Gasto promedio real por día: ${formatMoney(a.avgPerDay, a.currency)}
- Puede gastar por día con lo que queda: ${formatMoney(a.safeDailyBudget, a.currency)}
- Desvio de ritmo vs. plan: ${a.paceDelta >= 0 ? "+" : ""}${formatMoney(a.paceDelta, a.currency)}
- Proyección al ritmo actual: ${formatMoney(a.projectedTotal, a.currency)} (${a.projectedPct.toFixed(0)}% del presupuesto)${a.projectedOverrun > 0 ? ` — se pasaria por ${formatMoney(a.projectedOverrun, a.currency)}` : ""}
- Gasto más alto: ${a.biggestExpense ? `${a.biggestExpense.description} por ${formatMoney(a.biggestExpense.amount, a.currency)}` : "n/a"}

Gasto por grupo:
${buckets}

Detalle por categoría:
${detail}

Genera el análisis en JSON.`;
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

  const parsed = parseJsonLoose<{
    headline?: string;
    summary?: string;
    narrative?: string;
    insights?: Insight[];
  }>(raw);

  if (!parsed?.summary || !Array.isArray(parsed.insights) || parsed.insights.length === 0) {
    return local;
  }

  const validTones = new Set(["tip", "warning", "danger", "success"]);
  const insights = parsed.insights
    .filter((i) => i && typeof i.title === "string" && typeof i.detail === "string")
    .slice(0, 4)
    .map((i) => ({
      tone: (validTones.has(i.tone) ? i.tone : "tip") as Insight["tone"],
      title: String(i.title).slice(0, 80),
      detail: String(i.detail).slice(0, 240),
    }));

  if (insights.length === 0) return local;

  return {
    headline: (parsed.headline || local.headline).slice(0, 60),
    summary: parsed.summary.slice(0, 300),
    narrative: (parsed.narrative || local.narrative).slice(0, 260),
    health: a.health,
    signals: local.signals,
    insights,
    engine: "claude",
    generatedAt: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*  Motor heuristico local: siempre disponible, sin dependencias externas.     */
/* -------------------------------------------------------------------------- */

const BUCKET_TIPS: Record<Bucket, string> = {
  LODGING:
    "Si aún quedan noches por reservar, mira opciones a 15-20 min del centro: bajan cerca de un 30%.",
  FOOD: "Cambia una comida de restaurante por mercado local o menu del día: suele costar la mitad.",
  ACTIVITIES: "Busca un city pass o los días de entrada gratuita a museos: ahorras entre 20% y 40%.",
  TRANSPORT_OTHER:
    "Un pase de transporte de varios días sale mejor que pagar por trayecto, y deja los souvenirs para el último día con un tope fijo.",
};

export function localInsights(trip: TripLike, a: TripAnalytics): InsightsResult {
  const m = (n: number) => formatMoney(n, a.currency);
  const insights: Insight[] = [];

  // 1. Ritmo de gasto
  if (a.status === "NOT_STARTED") {
    insights.push({
      tone: "tip",
      title: "Tu viaje aún no empieza",
      detail: `Tienes ${m(a.budget)} para ${a.totalDays} días: ${m(a.plannedDailyBudget)} por día. Reserva alojamiento y transporte ahora para fijar los costos más grandes.`,
    });
  } else if (a.totalSpent > a.budget) {
    insights.push({
      tone: "danger",
      title: "Presupuesto excedido",
      detail: `Vas ${m(a.totalSpent - a.budget)} por encima del límite. Congela gastos no esenciales y prioriza comida de mercado y transporte público el resto del viaje.`,
    });
  } else if (a.projectedOverrun > 0) {
    insights.push({
      tone: "warning",
      title: `Al ritmo actual te pasarías por ${m(a.projectedOverrun)}`,
      detail: `Gastas ${m(a.avgPerDay)}/día y solo te alcanza para ${m(a.safeDailyBudget)}/día. Recorta ${m(Math.max(0, a.avgPerDay - a.safeDailyBudget))} diarios para llegar justo.`,
    });
  } else if (a.paceDelta < 0) {
    insights.push({
      tone: "success",
      title: `Vas ${m(Math.abs(a.paceDelta))} por debajo del plan`,
      detail: `Con ${m(a.remaining)} para ${a.daysLeft} días puedes gastar hasta ${m(a.safeDailyBudget)} diarios. Tienes margen para una actividad extra sin romper el presupuesto.`,
    });
  } else {
    insights.push({
      tone: "success",
      title: "Vas en linea con el plan",
      detail: `Llevas ${a.usedPct.toFixed(0)}% del presupuesto en el día ${a.elapsedDays} de ${a.totalDays}. Manten el ritmo de ${m(a.safeDailyBudget)} por día.`,
    });
  }

  // 2. Grupo de gasto dominante
  if (a.topBucket && a.topBucket.share >= 35) {
    const b = a.topBucket;
    insights.push({
      tone: b.share >= 55 ? "warning" : "tip",
      title: `${BUCKET_EMOJI[b.bucket]} ${b.label} concentra el ${b.share.toFixed(0)}% del gasto`,
      detail: `${m(b.total)} en ${b.count} registros. ${BUCKET_TIPS[b.bucket]}`,
    });
  }

  // 3. Gasto atipico
  if (a.biggestExpense && a.totalSpent > 0) {
    const share = (a.biggestExpense.amount / a.totalSpent) * 100;
    if (share >= 25 && a.expenseCount >= 3) {
      insights.push({
        tone: "tip",
        title: "Un solo gasto pesa demasiado",
        detail: `"${a.biggestExpense.description}" (${m(a.biggestExpense.amount)}) es el ${share.toFixed(0)}% de todo lo gastado. Si era puntual, tu ritmo real es más bajo de lo que parece.`,
      });
    }
  }

  // 4. Reparto entre acompañantes
  if (trip.companions.length > 0 && a.byPerson.length > 1) {
    const top = a.byPerson[0];
    const fairShare = 100 / (trip.companions.length + 1);
    if (top.share > fairShare * 1.5) {
      insights.push({
        tone: "tip",
        title: "Los pagos están desbalanceados",
        detail: `${top.name} ha puesto el ${top.share.toFixed(0)}% (${m(top.total)}) frente a un reparto parejo de ${fairShare.toFixed(0)}%. Buen momento para cuadrar cuentas del grupo.`,
      });
    }
  }

  // 5. Sin gastos todavia
  if (a.expenseCount === 0 && a.status !== "NOT_STARTED") {
    insights.push({
      tone: "tip",
      title: "Aún no registras gastos",
      detail:
        'Registra el primero con "Añadir gasto" o cuentaselo al asistente: "gaste 25 en el almuerzo". El panel se actualiza al instante.',
    });
  }

  const headline =
    a.status === "NOT_STARTED"
      ? "Todo listo para arrancar"
      : a.health === "over_budget"
        ? "Necesitas frenar el gasto"
        : a.health === "warning"
          ? "Cuidado con el ritmo"
          : "Vas bien";

  const summary =
    a.expenseCount === 0
      ? `Tienes ${m(a.budget)} para ${a.totalDays} días en ${trip.destination}. Eso es ${m(a.plannedDailyBudget)} por día.`
      : `Llevas ${m(a.totalSpent)} de ${m(a.budget)} (${a.usedPct.toFixed(0)}%) en el día ${a.elapsedDays} de ${a.totalDays}. ` +
        (a.daysLeft > 0
          ? `Te quedan ${m(a.remaining)} para ${a.daysLeft} días, es decir ${m(a.safeDailyBudget)} diarios.`
          : `El viaje termino con ${a.remaining >= 0 ? `${m(a.remaining)} sin usar` : `${m(Math.abs(a.remaining))} de sobrecosto`}.`);

  const signals = computeSignals(a);
  const overBucket = signals.find((s) => s.status === "over");

  const narrative =
    a.expenseCount === 0
      ? "Aún no hay suficientes datos — registra gastos y te avisaremos si algo se desvia del plan."
      : a.totalSpent > a.budget
        ? `Ya superaste el presupuesto en ${m(a.totalSpent - a.budget)}. Limita el gasto a lo esencial durante los ${a.daysLeft} días que faltan.`
        : a.projectedOverrun > 0
          ? `Al ritmo actual terminarías en ${m(a.projectedTotal)}, ${m(a.projectedOverrun)} por encima del límite. Baja a ${m(a.safeDailyBudget)} por día para llegar justo.`
          : overBucket
            ? `Cuida tu presupuesto en ${overBucket.label.toLowerCase()} — vas ${overBucket.detail} sobre lo esperado y aún faltan ${a.daysLeft} días de viaje.`
            : `Vas bien: ${a.usedPct.toFixed(0)}% del presupuesto en el día ${a.elapsedDays} de ${a.totalDays}. Puedes gastar ${m(a.safeDailyBudget)} por día sin desviarte.`;

  return {
    headline,
    summary,
    narrative,
    health: a.health,
    signals,
    insights: insights.slice(0, 4),
    engine: "local",
    generatedAt: new Date().toISOString(),
  };
}
