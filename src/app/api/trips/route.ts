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
    const body = tripSchema.parse(await request.json());

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
