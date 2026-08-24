import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { formatMoney } from "@/lib/format";

type Params = { params: Promise<{ tripId: string }> };

const schema = z.object({
  messageId: z.string().min(1),
  expenseId: z.string().min(1),
});

/**
 * Marca como confirmado el borrador de un recibo y deja la constancia en el chat.
 */
export async function POST(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { tripId } = await params;
    const { messageId, expenseId } = schema.parse(await request.json());

    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId: user.id } });
    if (!trip) return fail("El viaje no existe o no te pertenece", 404);

    const expense = await prisma.expense.findFirst({ where: { id: expenseId, tripId } });
    if (!expense) return fail("El gasto no existe", 404);

    // El borrador ya no debe poder confirmarse dos veces.
    await prisma.chatMessage.updateMany({
      where: { id: messageId, tripId },
      data: {
        kind: "text",
        payload: null,
        content: `Gasto registrado: ${expense.description} por ${formatMoney(expense.amount, trip.currency)}.`,
      },
    });

    return ok({ success: true });
  });
}
