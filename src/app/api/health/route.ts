import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico del despliegue.
 *
 * Responde si la aplicación tiene base de datos, si las tablas existen y si
 * están los datos de demostración, sin exponer credenciales: de la cadena de
 * conexión solo se devuelve el servidor, nunca el usuario ni la contraseña.
 *
 * Pensado para mirarlo desde el navegador tras desplegar:
 *   https://tu-app.vercel.app/api/health
 */
const CONNECTION_VARS = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_POSTGRES_URL",
];

/** Servidor de la conexion, sin usuario ni contrasena. */
function describeHost(url: string): string {
  if (url.startsWith("file:")) return "SQLite local";
  try {
    return new URL(url).host || "(sin servidor)";
  } catch {
    return "(cadena con formato no reconocible)";
  }
}

export async function GET() {
  const found = CONNECTION_VARS.find((name) => process.env[name]);

  const checks: Record<string, unknown> = {
    aplicacion: "en linea",
    baseDeDatos: found ? `configurada (${found} → ${describeHost(process.env[found]!)})` : "NO configurada",
    secretoDeSesion: process.env.AUTH_SECRET
      ? process.env.AUTH_SECRET.length >= 16
        ? "configurado"
        : "demasiado corto (minimo 16 caracteres)"
      : "NO configurado",
    asistenteIA: process.env.ANTHROPIC_API_KEY ? "Claude" : "motor local (sin API key)",
  };

  if (!found) {
    checks.tablas = "sin comprobar: no hay conexion";
    checks.queHacer = [
      "1. Vercel -> Settings -> Environment Variables",
      "2. Anade DATABASE_URL con la cadena de tu base Postgres",
      "3. Marca Production, Preview y Development",
      "4. Vuelve a desplegar: las variables se leen durante el build",
    ];
    return NextResponse.json({ estado: "incompleto", checks }, { status: 503 });
  }

  try {
    const usuarios = await prisma.user.count();
    const viajes = await prisma.trip.count();
    checks.tablas = "creadas";
    checks.datos = `${usuarios} usuarios, ${viajes} viajes`;
    checks.cuentaDemo =
      (await prisma.user.count({ where: { email: "demo@tripflow.app" } })) > 0
        ? "disponible (demo@tripflow.app / demo1234)"
        : "no sembrada; puedes registrarte con tu propia cuenta";

    return NextResponse.json({ estado: "correcto", checks });
  } catch (error) {
    checks.tablas = "no accesibles";
    checks.error = (error as Error).message.split("\n")[0];
    checks.queHacer = [
      "La cadena de conexion existe pero la base no responde o no tiene tablas.",
      "Vuelve a desplegar para que el build las cree, o revisa que la cadena",
      "sea correcta y termine en ?sslmode=require.",
    ];
    return NextResponse.json({ estado: "incompleto", checks }, { status: 503 });
  }
}
