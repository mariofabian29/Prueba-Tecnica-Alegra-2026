"use client";

import useSWR, { mutate as globalMutate } from "swr";
import type { TripAnalytics } from "@/lib/analytics";
import type { InsightsResult } from "@/lib/ai/insights";

export type ExpenseDTO = {
  id: string;
  tripId: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  place: string | null;
  date: string;
  paidBy: string;
  splitMode: string;
  receiptUrl: string | null;
  source: string;
  createdAt: string;
};

export type TripDTO = {
  id: string;
  destination: string;
  country: string | null;
  budget: number;
  currency: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  coverEmoji: string;
  photoUrl: string | null;
  companions: { id: string; name: string; email: string | null }[];
  expenses: ExpenseDTO[];
};

export type ExpenseDraft = {
  amount: number | null;
  category: string;
  description: string;
  date: string;
  receiptUrl?: string | null;
};

export type ChatMessageDTO = {
  id: string;
  role: "user" | "assistant";
  content: string;
  kind: "text" | "receipt" | "draft" | "upload";
  payload: string | null;
  createdAt: string;
};

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Error al cargar los datos");
  }
  return response.json();
}

export const tripKey = (tripId: string) => `/api/trips/${tripId}`;
export const insightsKey = (tripId: string) => `/api/trips/${tripId}/insights`;
export const chatKey = (tripId: string) => `/api/trips/${tripId}/chat`;
export const TRIPS_KEY = "/api/trips";

/**
 * Fuente de verdad del dashboard. Refresca cada 15s para mantener las graficas
 * al dia cuando el viaje se edita desde otra pestana o dispositivo.
 */
export function useTrip(tripId: string, fallback?: { trip: TripDTO; analytics: TripAnalytics }) {
  const { data, error, isLoading, mutate } = useSWR<{ trip: TripDTO; analytics: TripAnalytics }>(
    tripKey(tripId),
    fetcher,
    {
      fallbackData: fallback,
      refreshInterval: 15_000,
      revalidateOnFocus: true,
      keepPreviousData: true,
    }
  );

  return { trip: data?.trip, analytics: data?.analytics, error, isLoading, mutate };
}

export type TripSummary = {
  id: string;
  destination: string;
  country: string | null;
  photoUrl: string | null;
  budget: number;
  currency: string;
  startDate: string;
  endDate: string;
  spent: number;
  expenseCount: number;
};

/** Viajes vigentes del usuario, para la navegación lateral. */
export function useTrips() {
  const { data, error, isLoading } = useSWR<{ trips: TripSummary[] }>(TRIPS_KEY, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 10_000,
  });

  return { trips: data?.trips ?? [], error, isLoading };
}

export function useInsights(tripId: string) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<InsightsResult>(
    insightsKey(tripId),
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true, dedupingInterval: 10_000 }
  );

  return { insights: data, error, isLoading, isValidating, refresh: mutate };
}

export function useChat(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ messages: ChatMessageDTO[] }>(
    chatKey(tripId),
    fetcher,
    { revalidateOnFocus: false }
  );

  return { messages: data?.messages ?? [], error, isLoading, mutate };
}

/** Revalida viaje + insights tras cualquier mutacion de gastos. */
export async function revalidateTrip(tripId: string) {
  await Promise.all([globalMutate(tripKey(tripId)), globalMutate(insightsKey(tripId))]);
}

/**
 * Revalida la lista de viajes.
 * Se llama al crear o borrar uno para que la navegación lateral no se quede
 * mostrando una lista en caché.
 */
export async function revalidateTrips() {
  await globalMutate(TRIPS_KEY);
}
