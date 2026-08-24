/**
 * Genera el esquema de Postgres a partir del de SQLite.
 *
 * Prisma no admite elegir el proveedor con una variable de entorno, así que
 * hacen falta dos esquemas. En vez de mantenerlos a mano —con el riesgo de que
 * se separen— el de producción se deriva del de desarrollo cambiando solo el
 * bloque `datasource`. El resto del modelo es idéntico.
 *
 * Lo ejecuta el build de despliegue (`npm run build:deploy`). No necesita
 * conexión: generar el esquema y el cliente de Prisma no toca la base de datos.
 * De si hay conexión, y de qué hacer si falta, se ocupa scripts/deploy.mjs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

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
