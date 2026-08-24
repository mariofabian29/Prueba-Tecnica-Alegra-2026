import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { expenseSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";
import { parseDay } from "@/lib/trips";

type Params = { params: Promise<{ tripId: string; expenseId: string }> };

async function assertOwnership(tripId: string, expenseId: string, userId: string) {
  return prisma.expense.findFirst({ where: { id: expenseId, tripId, trip: { userId } } });
}

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { tripId, expenseId } = await params;

    const existing = await assertOwnership(tripId, expenseId, user.id);
    if (!existing) return fail("El gasto no existe o no te pertenece", 404);

    const body = expenseSchema.partial().parse(await request.json());

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(body.amount !== undefined && { amount: body.amount }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.date !== undefined && { date: parseDay(body.date) }),
        ...(body.paidBy !== undefined && { paidBy: body.paidBy }),
        ...(body.place !== undefined && { place: body.place || null }),
        ...(body.splitMode !== undefined && { splitMode: body.splitMode }),
      },
    });

    return ok({ expense });
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { tripId, expenseId } = await params;

    const existing = await assertOwnership(tripId, expenseId, user.id);
    if (!existing) return fail("El gasto no existe o no te pertenece", 404);

    await prisma.expense.delete({ where: { id: expenseId } });
    return ok({ success: true });
  });
}
