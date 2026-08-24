import "server-only";
import { prisma } from "@/lib/db";
import { startOfDay } from "@/lib/format";
import type { ExpenseLike, TripLike } from "@/lib/analytics";

export class NotFoundError extends Error {
  constructor(message = "No encontrado") {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Viajes vigentes del usuario: en curso o futuros.
 * Los viajes cuya fecha de fin ya paso se ignoran por diseño del producto.
 */
export async function listActiveTrips(userId: string) {
  const today = startOfDay(new Date());
  const trips = await prisma.trip.findMany({
    where: { userId, endDate: { gte: today } },
    orderBy: [{ startDate: "asc" }],
    include: {
      companions: { orderBy: { name: "asc" } },
      expenses: { select: { amount: true } },
    },
  });

  return trips.map((trip) => {
    const spent = trip.expenses.reduce((acc, e) => acc + e.amount, 0);
    const { expenses, ...rest } = trip;
    return { ...rest, spent, expenseCount: expenses.length };
  });
}

export async function getTripForUser(tripId: string, userId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      companions: { orderBy: { name: "asc" } },
      expenses: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
    },
  });
  if (!trip) throw new NotFoundError("El viaje no existe o no te pertenece");
  return trip;
}

/** Convierte el registro de Prisma a las formas planas que consume la analitica. */
export function toTripLike(trip: {
  id: string;
  destination: string;
  country: string | null;
  budget: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  companions: { id: string; name: string }[];
}): TripLike {
  return {
    id: trip.id,
    destination: trip.destination,
    country: trip.country,
    budget: trip.budget,
    currency: trip.currency,
    startDate: trip.startDate,
    endDate: trip.endDate,
    companions: trip.companions.map((c) => ({ id: c.id, name: c.name })),
  };
}

export function toExpenseLike(expenses: {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  paidBy: string;
  source: string;
}[]): ExpenseLike[] {
  return expenses.map((e) => ({
    id: e.id,
    amount: e.amount,
    category: e.category,
    description: e.description,
    date: e.date,
    paidBy: e.paidBy,
    source: e.source,
  }));
}

/** Fecha en mediodia local para evitar corrimientos de zona horaria en SQLite. */
export function parseDay(value: string): Date {
  return new Date(`${value}T12:00:00`);
}
