import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { tripSchema } from "@/lib/validation";
import { handle, ok } from "@/lib/api";
import { listActiveTrips, parseDay } from "@/lib/trips";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return ok({ trips: await listActiveTrips(user.id) });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser();

    // El formulario marca las fechas como opcionales: si faltan, planificamos
    // una ventana por defecto de 7 dias a partir de hoy.
    const raw = (await request.json()) as Record<string, unknown>;
    const body = tripSchema.parse({ ...raw, ...defaultDates(raw) });

    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        destination: body.destination,
        country: body.country || null,
        budget: body.budget,
        currency: body.currency,
        startDate: parseDay(body.startDate),
        endDate: parseDay(body.endDate),
        notes: body.notes || null,
        coverEmoji: body.coverEmoji || "🌍",
        companions: {
          create: (body.companions ?? [])
            .filter((c) => c.name.trim().length > 0)
            .map((c) => ({ name: c.name.trim(), email: c.email || null })),
        },
      },
      include: { companions: true },
    });

    return ok({ trip }, 201);
  });
}

function defaultDates(raw: Record<string, unknown>) {
  const startDate = typeof raw.startDate === "string" && raw.startDate ? raw.startDate : isoDay(0);
  const endDate =
    typeof raw.endDate === "string" && raw.endDate
      ? raw.endDate
      : isoDay(6, new Date(`${startDate}T12:00:00`));
  return { startDate, endDate };
}

function isoDay(offset: number, from = new Date()): string {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
