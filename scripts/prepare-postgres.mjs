/**
 * Genera el esquema de Postgres a partir del de SQLite.
 *
 * Prisma no admite elegir el proveedor con una variable de entorno, así que
 * hacen falta dos esquemas. En vez de mantenerlos a mano —con el riesgo de que
 * se separen— el de producción se deriva del de desarrollo cambiando solo el
 * bloque `datasource`. El resto del modelo es idéntico.
 *
 * Lo ejecuta el build de despliegue (`npm run build:deploy`).
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Se comprueba aqui, en el primer paso del despliegue, porque Prisma tambien
// necesita DATABASE_URL para generar el cliente: sin ella falla con un error
// poco descriptivo antes de llegar a tocar la base de datos.
if (!process.env.DATABASE_URL) {
  // Se listan los NOMBRES de las variables relacionadas que si existen (nunca
  // sus valores): asi el log dice por si solo si el proveedor las inyecto con
  // otro nombre o si sencillamente no hay ninguna.
  const related = Object.keys(process.env)
    .filter((name) => /^(DATABASE|POSTGRES|PG|NEON|AUTH|ANTHROPIC)/i.test(name))
    .sort();

  console.error("\n" + "=".repeat(60));
  console.error("  ✖ Falta la variable DATABASE_URL");
  console.error("=".repeat(60));

  if (related.length === 0) {
    console.error("  El despliegue no ve NINGUNA variable de base de datos.");
    console.error("  La base de datos no esta conectada a este proyecto.");
  } else {
    console.error("  Variables relacionadas que si llegan al build:");
    for (const name of related) console.error(`    · ${name}`);
    console.error("");
    console.error("  Si ves ahi una cadena de Postgres con otro nombre,");
    console.error("  copia su valor a una variable llamada DATABASE_URL.");
  }

  console.error("");
  console.error("  Como resolverlo: Vercel -> Settings -> Environment Variables");
  console.error("  Anade DATABASE_URL y marca Production, Preview y Development.");
  console.error("  Despues hay que volver a desplegar: las variables se leen");
  console.error("  durante el build, no despues.");
  console.error("");
  console.error("  Guia completa: DEPLOY.md\n");
  process.exit(1);
}

const root = process.cwd();
const source = path.join(root, "prisma", "schema.prisma");
const target = path.join(root, "prisma", "schema.postgres.prisma");

const schema = readFileSync(source, "utf8");

const DATASOURCE = /datasource\s+db\s*\{[^}]*\}/;
if (!DATASOURCE.test(schema)) {
  console.error("No se encontró el bloque datasource en prisma/schema.prisma");
  process.exit(1);
}

const generated = schema.replace(
  DATASOURCE,
  `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
);

const header = `// ARCHIVO GENERADO — no editar a mano.
// Se deriva de prisma/schema.prisma con scripts/prepare-postgres.mjs.
// Para cambiar el modelo, edita prisma/schema.prisma.

`;

writeFileSync(target, header + generated);
console.log("✓ prisma/schema.postgres.prisma generado a partir de prisma/schema.prisma");
