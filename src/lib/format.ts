export const CURRENCIES = ["USD", "EUR", "COP", "MXN", "ARS", "BRL", "CLP", "PEN", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export function formatMoney(amount: number, currency = "USD"): string {
  const fractionDigits = ["COP", "CLP", "ARS"].includes(currency) ? 0 : 2;
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(fractionDigits)}`;
  }
}

export function formatCompact(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-CO", opts ?? { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export function formatDayMonth(date: Date | string): string {
  return formatDate(date, { day: "2-digit", month: "short" });
}

/** YYYY-MM-DD en hora local, apto para <input type="date">. */
export function toDateInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

export function daysBetween(a: Date | string, b: Date | string): number {
  const d1 = typeof a === "string" ? new Date(a) : a;
  const d2 = typeof b === "string" ? new Date(b) : b;
  const ms = startOfDay(d2).getTime() - startOfDay(d1).getTime();
  return Math.round(ms / 86_400_000);
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
