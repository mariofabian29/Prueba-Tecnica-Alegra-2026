import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "viajero_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "Falta AUTH_SECRET en el archivo .env (mínimo 16 caracteres). Copia .env.example a .env."
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { userId: string; email: string; name: string };

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const { userId, email, name } = payload as unknown as SessionPayload;
    if (!userId) return null;
    return { userId, email, name };
  } catch {
    return null;
  }
}

/** Sesión valida + usuario existente en BD. Lanza si no hay sesión. */
export async function requireUser() {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) throw new UnauthorizedError();
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("No autenticado");
    this.name = "UnauthorizedError";
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
