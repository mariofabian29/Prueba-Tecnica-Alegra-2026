import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";

export async function POST(request: Request) {
  return handle(async () => {
    const body = loginSchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return fail("Correo o contrasena incorrectos", 401);
    }

    await createSession({ userId: user.id, email: user.email, name: user.name });
    return ok({ user: { id: user.id, name: user.name, email: user.email } });
  });
}
