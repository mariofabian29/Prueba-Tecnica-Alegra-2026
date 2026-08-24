/**
 * Build de despliegue, de principio a fin.
 *
 *   1. Resuelve la cadena de conexión (los proveedores la publican con
 *      nombres distintos).
 *   2. Genera el esquema de Postgres a partir del de SQLite.
 *   3. Genera el cliente de Prisma.
 *   4. Crea o actualiza las tablas y siembra la demostración.
 *   5. Compila la aplicación.
 *
 * Está en un único script para que todos los pasos compartan la misma
 * conexión ya resuelta, y para que cualquier fallo se explique en su contexto.
 */
import { execFileSync } from "node:child_process";

const SCHEMA = "prisma/schema.postgres.prisma";

/**
 * Nombres bajo los que los proveedores publican la cadena de la aplicación,
 * en orden de preferencia. La primera que exista es la que se usa.
 */
const RUNTIME_VARS = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_POSTGRES_URL",
];

/** Cadenas directas, necesarias para aplicar cambios de esquema. */
const DIRECT_VARS = [
  "DIRECT_DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_POSTGRES_URL_NON_POOLING",
];

const line = (char = "─") => console.log(char.repeat(60));

function step(title) {
  console.log("");
  line();
  console.log(`  ${title}`);
  line();
}

function warn(title, lines) {
  console.warn("");
  line("!");
  console.warn(`  ⚠ ${title}`);
  line("!");
  for (const l of lines) console.warn(`  ${l}`);
  console.warn("");
}

function abort(title, lines) {
  console.error("");
  line("=");
  console.error(`  ✖ ${title}`);
  line("=");
  for (const l of lines) console.error(`  ${l}`);
  console.error("");
  console.error("  Guía completa: DEPLOY.md");
  console.error("");
  process.exit(1);
}

/** Oculta la contraseña al mostrar una cadena de conexión. */
function safe(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.username ? "***@" : ""}${u.host}${u.pathname}`;
  } catch {
    return "(cadena con formato no reconocible)";
  }
}

function run(command, args, env = {}) {
  execFileSync(command, args, { stdio: "inherit", env: { ...process.env, ...env } });
}

/* ------------------------- 1. Cadena de conexión ------------------------- */

step("Conexión a la base de datos");

const runtimeVar = RUNTIME_VARS.find((name) => process.env[name]);

/**
 * La base de datos es opcional para COMPILAR: Prisma genera el cliente sin
 * conexión. Si falta, se avisa con claridad y el despliegue continúa, de modo
 * que siempre queda una URL publicada donde ver qué ocurre, en lugar de un
 * build fallido cuyo log hay que ir a buscar.
 */
let runtimeUrl = null;

if (runtimeVar) {
  runtimeUrl = process.env[runtimeVar];
  process.env.DATABASE_URL = runtimeUrl;
  console.log(`  Aplicación: ${safe(runtimeUrl)}  (${runtimeVar})`);
} else {
  // Se listan los NOMBRES de las variables relacionadas, nunca sus valores.
  const related = Object.keys(process.env)
    .filter((name) => /^(DATABASE|POSTGRES|PG|NEON)/i.test(name))
    .sort();

  warn("No hay ninguna cadena de conexión a la base de datos", [
    related.length === 0
      ? "El despliegue no ve NINGUNA variable de base de datos."
      : "Variables de base de datos que sí llegan al build:",
    ...related.map((n) => `  · ${n}`),
    "",
    "Se buscaron estos nombres:",
    ...RUNTIME_VARS.map((n) => `  · ${n}`),
    "",
    "La aplicación se va a publicar igualmente, pero sin base de datos no se",
    "podrá iniciar sesión ni registrarse. Para arreglarlo:",
    "  1. Vercel → Settings → Environment Variables",
    "  2. Añade DATABASE_URL (Production, Preview y Development)",
    "  3. Vuelve a desplegar: las variables se leen durante el build",
    "",
    "Comprueba el estado en:  https://TU-APP.vercel.app/api/health",
  ]);
}

/* --------------------- 2 y 3. Esquema y cliente -------------------------- */

step("Esquema y cliente de Prisma");
run("node", ["scripts/prepare-postgres.mjs"]);
run("npx", ["prisma", "generate", "--schema", SCHEMA]);

/* ----------------------------- 4. Tablas -------------------------------- */

step("Tablas y datos de demostración");

if (!runtimeUrl) {
  console.log("  Se omite: no hay conexión configurada.");
}

/**
 * Candidatas para aplicar el esquema, en orden. Los cambios de esquema no
 * pueden ir por el pool de conexiones: trabaja en modo transacción y rechaza
 * sentencias preparadas. Neon marca el pool con "-pooler" en el host, así que
 * si el proveedor no publica la directa, se deduce quitándolo.
 */
const candidates = [];
const directVar = DIRECT_VARS.find((name) => process.env[name]);
if (directVar) {
  candidates.push({ label: `conexión directa (${directVar})`, url: process.env[directVar] });
}
if (/-pooler\./.test(runtimeUrl)) {
  candidates.push({
    label: "conexión directa (deducida del host)",
    url: runtimeUrl.replace("-pooler.", "."),
  });
}
candidates.push({ label: `conexión de la aplicación (${runtimeVar})`, url: runtimeUrl });

const seen = new Set();
const unique = candidates.filter((c) => !seen.has(c.url) && seen.add(c.url));

let applied = null;
let lastError = null;

for (const candidate of runtimeUrl ? unique : []) {
  console.log(`\n▸ Creando las tablas con la ${candidate.label}`);
  console.log(`  ${safe(candidate.url)}`);
  try {
    run("npx", ["prisma", "db", "push", "--schema", SCHEMA, "--skip-generate", "--accept-data-loss"], {
      DATABASE_URL: candidate.url,
    });
    applied = candidate;
    break;
  } catch (error) {
    lastError = error;
    console.log("  No funcionó con esta cadena.");
  }
}

if (runtimeUrl && !applied) {
  warn("No se pudieron crear las tablas", [
    "Se probaron estas conexiones y ninguna respondió:",
    ...unique.map((c) => `  · ${c.label} → ${safe(c.url)}`),
    "",
    "Revisa que la cadena sea correcta y termine en ?sslmode=require.",
    `Último error: ${lastError?.message ?? "desconocido"}`,
    "",
    "La aplicación se publica igualmente. Comprueba el estado en:",
    "  https://TU-APP.vercel.app/api/health",
  ]);
} else if (applied) {
  console.log(`\n✓ Tablas listas (${applied.label})`);

  try {
    console.log("\n▸ Cargando los datos de demostración");
    run("npx", ["tsx", "prisma/seed.ts"], { DATABASE_URL: applied.url });
  } catch {
    // No son imprescindibles para que la aplicación funcione.
    console.warn("\n⚠ No se pudieron cargar los datos de demostración. El despliegue continúa.");
    console.warn("  Podrás registrarte con tu propia cuenta igualmente.");
  }
}

/* --------------------------- 5. Compilación ------------------------------ */

step("Compilando la aplicación");
run("npx", ["next", "build"]);
