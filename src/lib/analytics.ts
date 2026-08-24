import {
  BUCKETS,
  BUCKET_META,
  CATEGORIES,
  categoryMeta,
  type Bucket,
  type Category,
} from "@/lib/categories";
import { daysBetween, startOfDay } from "@/lib/format";

export type ExpenseLike = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string | Date;
  paidBy: string;
  source: string;
};

export type TripLike = {
  id: string;
  destination: string;
  country?: string | null;
  budget: number;
  currency: string;
  startDate: string | Date;
  endDate: string | Date;
  companions: { id: string; name: string }[];
};

export type CategoryBreakdown = {
  category: Category;
  label: string;
  emoji: string;
  color: string;
  total: number;
  share: number;
  count: number;
};

export type DailyPoint = {
  date: string;          // YYYY-MM-DD
  label: string;         // "12 ago"
  spent: number;         // gasto del dia
  cumulative: number;    // acumulado real
  idealCumulative: number; // linea recta del presupuesto
  isFuture: boolean;
};

export type PersonBreakdown = { name: string; total: number; count: number; share: number };

/** Agrupacion de alto nivel que muestra el dashboard (4 tarjetas). */
export type BucketBreakdown = {
  bucket: Bucket;
  label: string;
  color: string;
  total: number;
  share: number;
  count: number;
};

export type TripAnalytics = {
  currency: string;
  budget: number;
  totalSpent: number;
  remaining: number;
  usedPct: number;
  expenseCount: number;
  /** Duracion total del viaje en dias (inclusivo). */
  totalDays: number;
  /** Dias transcurridos hasta hoy (min 1, max totalDays). */
  elapsedDays: number;
  daysLeft: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";
  /** Promedio de gasto por dia transcurrido. */
  avgPerDay: number;
  /** Cuanto se puede gastar por dia con lo que queda. */
  safeDailyBudget: number;
  /** Presupuesto diario planificado (budget / totalDays). */
  plannedDailyBudget: number;
  /** Proyección de gasto total al ritmo actual. */
  projectedTotal: number;
  projectedOverrun: number;
  /** Diferencia entre lo gastado y lo que "deberia" llevar gastado hoy. */
  paceDelta: number;
  /** on_track | warning | over_budget */
  health: "on_track" | "warning" | "over_budget";
  byCategory: CategoryBreakdown[];
  byBucket: BucketBreakdown[];
  topCategory: CategoryBreakdown | null;
  topBucket: BucketBreakdown | null;
  /** Proyección expresada como porcentaje del presupuesto. */
  projectedPct: number;
  daily: DailyPoint[];
  byPerson: PersonBreakdown[];
  biggestExpense: ExpenseLike | null;
  last7DaysAvg: number;
};

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shortLabel(d: Date): string {
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" }).format(d);
}

export function computeAnalytics(
  trip: TripLike,
  expenses: ExpenseLike[],
  now: Date = new Date()
): TripAnalytics {
  const start = startOfDay(new Date(trip.startDate));
  const end = startOfDay(new Date(trip.endDate));
  const today = startOfDay(now);

  const totalDays = Math.max(1, daysBetween(start, end) + 1);
  const status: TripAnalytics["status"] =
    today < start ? "NOT_STARTED" : today > end ? "FINISHED" : "IN_PROGRESS";

  const elapsedDays =
    status === "NOT_STARTED" ? 0 : Math.min(totalDays, Math.max(1, daysBetween(start, today) + 1));
  const remainingDays =
    status === "FINISHED" ? 0 : status === "NOT_STARTED" ? totalDays : Math.max(0, daysBetween(today, end) + 1);

  const totalSpent = round2(expenses.reduce((acc, e) => acc + e.amount, 0));
  const remaining = round2(trip.budget - totalSpent);
  const usedPct = trip.budget > 0 ? (totalSpent / trip.budget) * 100 : 0;

  // ---- Desglose por categoría ----
  const byCategory: CategoryBreakdown[] = CATEGORIES.map((category) => {
    const items = expenses.filter((e) => e.category === category);
    const total = round2(items.reduce((acc, e) => acc + e.amount, 0));
    const meta = categoryMeta(category);
    return {
      category,
      label: meta.label,
      emoji: meta.emoji,
      color: meta.color,
      total,
      count: items.length,
      share: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
    };
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.total - a.total);

  // ---- Desglose por bucket (las 4 tarjetas del dashboard) ----
  const byBucket: BucketBreakdown[] = BUCKETS.map((bucket) => {
    const items = expenses.filter((e) => categoryMeta(e.category).bucket === bucket);
    const total = round2(items.reduce((acc, e) => acc + e.amount, 0));
    return {
      bucket,
      label: BUCKET_META[bucket].label,
      color: BUCKET_META[bucket].color,
      total,
      count: items.length,
      share: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
    };
  });

  // ---- Serie diaria ----
  const spentByDay = new Map<string, number>();
  for (const e of expenses) {
    const key = toKey(startOfDay(new Date(e.date)));
    spentByDay.set(key, round2((spentByDay.get(key) ?? 0) + e.amount));
  }

  const daily: DailyPoint[] = [];
  let cumulative = 0;
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toKey(d);
    const spent = spentByDay.get(key) ?? 0;
    const isFuture = d > today;
    if (!isFuture) cumulative = round2(cumulative + spent);
    daily.push({
      date: key,
      label: shortLabel(d),
      spent,
      cumulative,
      idealCumulative: round2((trip.budget / totalDays) * (i + 1)),
      isFuture,
    });
  }

  // ---- Ritmo y proyecciónes ----
  const avgPerDay = elapsedDays > 0 ? round2(totalSpent / elapsedDays) : 0;
  const plannedDailyBudget = round2(trip.budget / totalDays);
  const safeDailyBudget = remainingDays > 0 ? round2(Math.max(0, remaining) / remainingDays) : 0;
  const projectedTotal =
    status === "FINISHED" ? totalSpent : round2(totalSpent + avgPerDay * remainingDays);
  const projectedOverrun = round2(Math.max(0, projectedTotal - trip.budget));
  const expectedByNow = round2(plannedDailyBudget * elapsedDays);
  const paceDelta = round2(totalSpent - expectedByNow);

  const health: TripAnalytics["health"] =
    totalSpent > trip.budget || projectedOverrun > trip.budget * 0.05
      ? "over_budget"
      : paceDelta > trip.budget * 0.05
        ? "warning"
        : "on_track";

  // ---- Por persona ----
  const people = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const key = e.paidBy?.trim() || "Yo";
    const prev = people.get(key) ?? { total: 0, count: 0 };
    people.set(key, { total: round2(prev.total + e.amount), count: prev.count + 1 });
  }
  const byPerson: PersonBreakdown[] = [...people.entries()]
    .map(([name, v]) => ({ name, ...v, share: totalSpent > 0 ? (v.total / totalSpent) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);

  const biggestExpense =
    expenses.length > 0 ? [...expenses].sort((a, b) => b.amount - a.amount)[0] : null;

  const last7 = daily.filter((d) => !d.isFuture).slice(-7);
  const last7DaysAvg = last7.length ? round2(last7.reduce((a, d) => a + d.spent, 0) / last7.length) : 0;

  return {
    currency: trip.currency,
    budget: trip.budget,
    totalSpent,
    remaining,
    usedPct,
    expenseCount: expenses.length,
    totalDays,
    elapsedDays,
    daysLeft: remainingDays,
    status,
    avgPerDay,
    safeDailyBudget,
    plannedDailyBudget,
    projectedTotal,
    projectedOverrun,
    paceDelta,
    health,
    byCategory,
    byBucket,
    topCategory: byCategory[0] ?? null,
    topBucket: [...byBucket].sort((a, b) => b.total - a.total)[0] ?? null,
    projectedPct: trip.budget > 0 ? (projectedTotal / trip.budget) * 100 : 0,
    daily,
    byPerson,
    biggestExpense,
    last7DaysAvg,
  };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
