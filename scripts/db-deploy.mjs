/**
 * Prepara la base de datos en el despliegue.
 *
 *   1. Comprueba que hay conexión configurada y explica qué falta si no.
 *   2. Crea o actualiza las tablas.
 *   3. Siembra la cuenta de demostración.
 *
 * Sobre la conexión: los proveedores gestionados (Neon, Supabase) suelen
 * entregar dos cadenas, una a través de un *pool* y otra directa. Los cambios
 * de esquema deben ir por la directa —el pool trabaja en modo transacción y
 * rechaza sentencias preparadas—, así que si el proveedor la publica se usa
 * esa para este paso. La aplicación sigue usando la del pool en tiempo de
 * ejecución, que es lo correcto.
 */
import { execFileSync } from "node:child_process";

const SCHEMA = "prisma/schema.postgres.prisma";

/** Cadenas directas que publican los proveedores más habituales. */
const DIRECT_VARS = [
  "DIRECT_DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
];

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  console.error("  Revisa los pasos 2 y 3 de DEPLOY.md.\n");
  process.exit(1);
}

const runtimeUrl = process.env.DATABASE_URL;
if (!runtimeUrl) {
  fail(
    "No hay DATABASE_URL. La base de datos no está conectada al proyecto,\n" +
      "  o la variable no se añadió al entorno del despliegue."
  );
}

const directName = DIRECT_VARS.find((name) => process.env[name]);
const migrationUrl = directName ? process.env[directName] : runtimeUrl;

if (directName) {
  console.log(`▸ Cambios de esquema con la conexión directa (${directName})`);
} else if (/-pooler\./.test(runtimeUrl)) {
  console.log("▸ Aviso: DATABASE_URL apunta a un pool y no hay conexión directa publicada.");
  console.log("  Si este paso falla, define DIRECT_DATABASE_URL con la cadena sin pool.");
}

function run(command, args, env) {
  console.log(`▸ ${command} ${args.join(" ")}`);
  execFileSync(command, args, { stdio: "inherit", env: { ...process.env, ...env } });
}

try {
  run("npx", ["prisma", "db", "push", "--schema", SCHEMA, "--skip-generate", "--accept-data-loss"], {
    DATABASE_URL: migrationUrl,
  });
} catch {
  fail("No se pudieron crear las tablas. Comprueba que DATABASE_URL es válida y accesible.");
}

try {
  run("npx", ["tsx", "prisma/seed.ts"], { DATABASE_URL: migrationUrl });
} catch {
  // Los datos de demostración no son imprescindibles para que la app funcione.
  console.warn("\n⚠ No se pudieron cargar los datos de demostración. El despliegue continúa.");
  console.warn("  Podrás registrarte con tu propia cuenta igualmente.\n");
}

console.log("\n✓ Base de datos lista\n");
