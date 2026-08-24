import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";

export async function POST(request: Request) {
  return handle(async () => {
    const body = loginSchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });

    // Se distingue una cuenta inexistente de una contraseña equivocada para que
    // el mensaje sea accionable. Es una concesión deliberada: permite averiguar
    // qué correos están registrados, algo aceptable en una demo pero que en
    // producción conviene sustituir por un mensaje genérico.
    if (!user) {
      return fail("No encontramos ninguna cuenta con ese correo.", 404, undefined, {
        reason: "no_account",
      });
    }

    if (!(await verifyPassword(body.password, user.passwordHash))) {
      return fail("La contraseña no es correcta. Vuelve a intentarlo.", 401, undefined, {
        reason: "bad_password",
      });
    }

    await createSession({ userId: user.id, email: user.email, name: user.name });
    return ok({ user: { id: user.id, name: user.name, email: user.email } });
  });
}
