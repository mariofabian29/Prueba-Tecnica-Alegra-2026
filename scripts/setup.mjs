/**
 * Preparacion del entorno local en un solo paso.
 *
 *   1. Crea .env a partir de .env.example si todavia no existe,
 *      generando un AUTH_SECRET aleatorio.
 *   2. Genera el cliente de Prisma y aplica las migraciones.
 *   3. Carga los datos de demostracion.
 *
 * Se ejecuta con `npm run setup`.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");

function step(message) {
  console.log(`\n▸ ${message}`);
}

step("Configurando variables de entorno");
if (existsSync(envPath)) {
  console.log("  .env ya existe, se conserva tal cual.");
} else {
  if (!existsSync(examplePath)) {
    console.error("  No se encontro .env.example. Aborto.");
    process.exit(1);
  }
  const secret = randomBytes(32).toString("hex");
  const contents = readFileSync(examplePath, "utf8").replace(
    /AUTH_SECRET="[^"]*"/,
    `AUTH_SECRET="${secret}"`
  );
  writeFileSync(envPath, contents);
  console.log("  .env creado con un AUTH_SECRET aleatorio.");
}

function run(command, description) {
  step(description);
  execSync(command, { stdio: "inherit", cwd: root });
}

run("npx prisma generate", "Generando el cliente de Prisma");
run("npx prisma migrate deploy", "Aplicando migraciones de la base de datos");
run("npx tsx prisma/seed.ts", "Cargando datos de demostracion");

console.log("\n✓ Todo listo. Arranca la app con:  npm run dev");
console.log("  Luego entra en http://localhost:3000 con demo@tripflow.app / demo1234\n");
