import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { computeAnalytics } from "@/lib/analytics";
import { getTripForUser, NotFoundError, toExpenseLike, toTripLike } from "@/lib/trips";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { tripId } = await params;

    try {
      const trip = await getTripForUser(tripId, user.id);
      const analytics = computeAnalytics(toTripLike(trip), toExpenseLike(trip.expenses));
      return ok({ trip, analytics });
    } catch (error) {
      if (error instanceof NotFoundError) return fail(error.message, 404);
      throw error;
    }
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { tripId } = await params;

    const result = await prisma.trip.deleteMany({ where: { id: tripId, userId: user.id } });
    if (result.count === 0) return fail("El viaje no existe o no te pertenece", 404);
    return ok({ success: true });
  });
}
