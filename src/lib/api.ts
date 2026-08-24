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

/** Envuelve un route handler traduciendo excepciones conocidas a respuestas HTTP. */
export function handle(fn: () => Promise<Response>): Promise<Response> {
  return fn().catch((error: unknown) => {
    if (error instanceof UnauthorizedError) return fail("Debes iniciar sesión", 401);
    if (error instanceof ZodError) return fail("Revisa los datos del formulario", 422, zodErrors(error));
    console.error("[api]", error);
    return fail("Ocurrio un error inesperado en el servidor", 500);
  });
}
