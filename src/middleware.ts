import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "viajero_session";
const PROTECTED_PREFIXES = ["/viajes", "/nuevo-viaje"];
const AUTH_ROUTES = ["/login", "/registro"];

/**
 * Guarda de rutas ligera: solo comprueba la presencia de la cookie de sesion.
 * La verificacion criptografica real ocurre en cada route handler / server component.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/viajes", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
