import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { chatSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";
import { computeAnalytics } from "@/lib/analytics";
import { runChatbot } from "@/lib/ai/chatbot";
import { getTripForUser, NotFoundError, parseDay, toExpenseLike, toTripLike } from "@/lib/trips";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { tripId } = await params;

    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId: user.id } });
    if (!trip) return fail("El viaje no existe o no te pertenece", 404);

    const messages = await prisma.chatMessage.findMany({
      where: { tripId },
      orderBy: { createdAt: "asc" },
      take: 80,
    });

    return ok({ messages });
  });
}

export async function POST(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { tripId } = await params;
    const { message } = chatSchema.parse(await request.json());

    let trip;
    try {
      trip = await getTripForUser(tripId, user.id);
    } catch (error) {
      if (error instanceof NotFoundError) return fail(error.message, 404);
      throw error;
    }

    const tripLike = toTripLike(trip);
    const analytics = computeAnalytics(tripLike, toExpenseLike(trip.expenses));

    const history = await prisma.chatMessage.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const result = await runChatbot(message, tripLike, analytics, history.reverse());

    // El mensaje del usuario se persiste siempre.
    const userMessage = await prisma.chatMessage.create({
      data: { tripId, role: "user", content: message },
    });

    let createdExpense = null;
    if (result.intent === "add_expense") {
      createdExpense = await prisma.expense.create({
        data: {
          tripId,
          amount: result.expense.amount,
          currency: trip.currency,
          category: result.expense.category,
          description: result.expense.description,
          date: parseDay(result.expense.date),
          paidBy: result.expense.paidBy,
          source: "CHATBOT",
        },
      });
    }

    const assistantMessage = await prisma.chatMessage.create({
      data: { tripId, role: "assistant", content: result.reply },
    });

    return ok({
      intent: result.intent,
      engine: result.engine,
      userMessage,
      assistantMessage,
      expense: createdExpense,
    });
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { tripId } = await params;

    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId: user.id } });
    if (!trip) return fail("El viaje no existe o no te pertenece", 404);

    await prisma.chatMessage.deleteMany({ where: { tripId } });
    return ok({ success: true });
  });
}
