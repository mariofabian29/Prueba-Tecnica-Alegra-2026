import { prisma } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";

export async function POST(request: Request) {
  return handle(async () => {
    const body = registerSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return fail("Ya existe una cuenta con ese correo", 409, { email: "Ya existe una cuenta con ese correo" });

    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, passwordHash: await hashPassword(body.password) },
    });

    await createSession({ userId: user.id, email: user.email, name: user.name });
    return ok({ user: { id: user.id, name: user.name, email: user.email } }, 201);
  });
}
