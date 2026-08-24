import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/lib/auth";
import { zodErrors } from "@/lib/validation";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json({ error: message, fields }, { status });
}

/**
 * Traduce los fallos de base de datos a un mensaje que explique qué hacer.
 *
 * Sin esto, un despliegue sin base de datos configurada responde «error
 * inesperado» a todo, que es justo lo que no ayuda a resolverlo.
 */
function describeDatabaseProblem(error: unknown): string | null {
  const name = (error as { name?: string })?.name ?? "";
  const code = (error as { code?: string })?.code ?? "";
  const message = (error as { message?: string })?.message ?? "";

  // Falta la variable de conexión o el cliente no pudo arrancar.
  if (name === "PrismaClientInitializationError" || /environment variable.*not found/i.test(message)) {
    return "La base de datos no está configurada en el servidor. Revisa /api/health para ver qué falta.";
  }

  // P1001: no se alcanza el servidor. P1000: credenciales rechazadas.
  if (code === "P1001" || code === "P1000" || /can't reach database server/i.test(message)) {
    return "No se puede conectar con la base de datos. Revisa /api/health para ver el estado.";
  }

  // P2021 / P2022: la tabla o la columna no existen: falta aplicar el esquema.
  if (code === "P2021" || code === "P2022" || /does not exist in the current database/i.test(message)) {
    return "La base de datos existe pero le faltan las tablas. Vuelve a desplegar para crearlas, o revisa /api/health.";
  }

  return null;
}

/** Envuelve un route handler traduciendo excepciones conocidas a respuestas HTTP. */
export function handle(fn: () => Promise<Response>): Promise<Response> {
  return fn().catch((error: unknown) => {
    if (error instanceof UnauthorizedError) return fail("Debes iniciar sesión", 401);
    if (error instanceof ZodError) return fail("Revisa los datos del formulario", 422, zodErrors(error));

    const databaseProblem = describeDatabaseProblem(error);
    if (databaseProblem) {
      console.error("[api] base de datos:", error);
      return fail(databaseProblem, 503);
    }

    console.error("[api]", error);
    return fail("Ocurrió un error inesperado en el servidor", 500);
  });
}
