/**
 * Prepara la base de datos en el despliegue.
 *
 *   1. Informa de la configuración detectada, para que el log sea legible.
 *   2. Crea o actualiza las tablas.
 *   3. Siembra la cuenta de demostración.
 *
 * Sobre la conexión: los proveedores gestionados entregan dos cadenas, una a
 * través de un *pool* y otra directa. Los cambios de esquema deben ir por la
 * directa —el pool trabaja en modo transacción y rechaza sentencias
 * preparadas—, mientras que la aplicación usa la del pool en ejecución.
 * Si el proveedor no publica la directa, se deduce a partir de la del pool.
 */
import { execFileSync } from "node:child_process";

const SCHEMA = "prisma/schema.postgres.prisma";

/** Cadenas directas que publican los proveedores más habituales. */
const DIRECT_VARS = ["DIRECT_DATABASE_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"];

function banner(title) {
  console.log(`\n${"─".repeat(60)}\n  ${title}\n${"─".repeat(60)}`);
}

function fail(title, lines) {
  console.error(`\n${"═".repeat(60)}`);
  console.error(`  ✖ ${title}`);
  console.error("═".repeat(60));
  for (const line of lines) console.error(`  ${line}`);
  console.error(`\n  Guía completa: DEPLOY.md\n`);
  process.exit(1);
}

/** Oculta la contraseña al mostrar una cadena de conexión en el log. */
function safe(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.username ? "***@" : ""}${u.host}${u.pathname}`;
  } catch {
    return "(cadena con formato no reconocible)";
  }
}

const runtimeUrl = process.env.DATABASE_URL;
if (!runtimeUrl) {
  fail("Falta la variable DATABASE_URL", [
    "La base de datos no está conectada al proyecto.",
    "Añádela en Vercel: Settings → Environment Variables.",
  ]);
}

/**
 * Candidatas para aplicar el esquema, en orden de preferencia.
 * Se prueba la directa primero y se recurre a la del pool si no funciona.
 */
function migrationCandidates() {
  const out = [];

  const named = DIRECT_VARS.find((name) => process.env[name]);
  if (named) out.push({ label: `conexión directa (${named})`, url: process.env[named] });

  // Neon y otros marcan el pool con "-pooler" en el host: quitarlo da la directa.
  if (/-pooler\./.test(runtimeUrl)) {
    out.push({ label: "conexión directa (deducida del host)", url: runtimeUrl.replace("-pooler.", ".") });
  }

  out.push({ label: "conexión de la aplicación (DATABASE_URL)", url: runtimeUrl });

  // Sin duplicados, conservando el orden.
  const seen = new Set();
  return out.filter((c) => !seen.has(c.url) && seen.add(c.url));
}

banner("Base de datos");
console.log(`  Aplicación: ${safe(runtimeUrl)}`);

const candidates = migrationCandidates();
let applied = null;
let lastError = null;

for (const candidate of candidates) {
  console.log(`\n▸ Creando las tablas con la ${candidate.label}`);
  console.log(`  ${safe(candidate.url)}`);
  try {
    execFileSync(
      "npx",
      ["prisma", "db", "push", "--schema", SCHEMA, "--skip-generate", "--accept-data-loss"],
      { stdio: "inherit", env: { ...process.env, DATABASE_URL: candidate.url } }
    );
    applied = candidate;
    break;
  } catch (error) {
    lastError = error;
    console.log(`  No funcionó con esta cadena.`);
  }
}

if (!applied) {
  fail("No se pudieron crear las tablas", [
    "Se probaron estas conexiones y ninguna respondió:",
    ...candidates.map((c) => `  · ${c.label} → ${safe(c.url)}`),
    "",
    "Revisa que la cadena sea correcta y termine en ?sslmode=require.",
    `Último error: ${lastError?.message ?? "desconocido"}`,
  ]);
}

console.log(`\n✓ Tablas listas (${applied.label})`);

try {
  console.log("\n▸ Cargando los datos de demostración");
  execFileSync("npx", ["tsx", "prisma/seed.ts"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: applied.url },
  });
} catch {
  // Los datos de demostración no son imprescindibles para que la app funcione.
  console.warn("\n⚠ No se pudieron cargar los datos de demostración. El despliegue continúa.");
  console.warn("  Podrás registrarte con tu propia cuenta igualmente.");
}

banner("Base de datos lista");
