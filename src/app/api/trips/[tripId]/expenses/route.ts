import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { expenseSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";
import { computeAnalytics } from "@/lib/analytics";
import { getTripForUser, NotFoundError, parseDay, toExpenseLike, toTripLike } from "@/lib/trips";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { tripId } = await params;

    try {
      const trip = await getTripForUser(tripId, user.id);
      const analytics = computeAnalytics(toTripLike(trip), toExpenseLike(trip.expenses));
      return ok({ expenses: trip.expenses, analytics });
    } catch (error) {
      if (error instanceof NotFoundError) return fail(error.message, 404);
      throw error;
    }
  });
}

export async function POST(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { tripId } = await params;
    const body = expenseSchema.parse(await request.json());

    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId: user.id } });
    if (!trip) return fail("El viaje no existe o no te pertenece", 404);

    const expense = await prisma.expense.create({
      data: {
        tripId,
        amount: body.amount,
        currency: trip.currency,
        category: body.category,
        description: body.description,
        place: body.place || null,
        date: parseDay(body.date),
        paidBy: body.paidBy,
        splitMode: body.splitMode,
        receiptUrl: body.receiptUrl || null,
        source: body.source,
      },
    });

    return ok({ expense }, 201);
  });
}
