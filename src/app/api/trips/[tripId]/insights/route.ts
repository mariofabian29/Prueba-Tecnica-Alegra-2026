import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { computeAnalytics } from "@/lib/analytics";
import { generateInsights } from "@/lib/ai/insights";
import { getTripForUser, NotFoundError, toExpenseLike, toTripLike } from "@/lib/trips";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { tripId } = await params;

    try {
      const trip = await getTripForUser(tripId, user.id);
      const tripLike = toTripLike(trip);
      const analytics = computeAnalytics(tripLike, toExpenseLike(trip.expenses));
      const insights = await generateInsights(tripLike, analytics);
      return ok(insights);
    } catch (error) {
      if (error instanceof NotFoundError) return fail(error.message, 404);
      throw error;
    }
  });
}
