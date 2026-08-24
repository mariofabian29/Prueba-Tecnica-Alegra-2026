/**
 * Datos de demostracion de Tripflow.
 * Crea un usuario, dos viajes vigentes y gastos realistas en ambas vias de
 * registro (manual y chatbot). Es idempotente: puede ejecutarse varias veces.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@tripflow.app";
const DEMO_PASSWORD = "demo1234";

function dayOffset(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

type ExpenseRow = [
  daysAgo: number,
  amount: number,
  category: string,
  description: string,
  paidBy: string,
  source: string,
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash },
    create: { email: DEMO_EMAIL, name: "Mario Fabian", passwordHash },
  });

  // Empezamos de cero para que el seed sea reproducible.
  await prisma.trip.deleteMany({ where: { userId: user.id } });

  /* ------------------------------------------------------------------ */
  /*  Viaje en curso: Cartagena                                          */
  /* ------------------------------------------------------------------ */

  const cartagena = await prisma.trip.create({
    data: {
      userId: user.id,
      destination: "Cartagena",
      country: "Colombia",
      budget: 2_000_000,
      currency: "COP",
      startDate: dayOffset(-2),
      endDate: dayOffset(2),
      coverEmoji: "🇨🇴",
      notes: "Cinco dias por la ciudad amurallada, Bocagrande y las islas.",
      companions: { create: [{ name: "Laura Gomez", email: "laura@example.com" }] },
    },
  });

  const cartagenaExpenses: ExpenseRow[] = [
    [2, 300_000, "FLIGHTS", "Vuelo Bogota - Cartagena", "Mario Fabian", "MANUAL"],
    [1, 164_000, "FOOD", "Comida en Chuzales Cartagena", "Mario Fabian", "CHATBOT"],
    [1, 45_000, "TRANSPORT", "Taxi del aeropuerto al centro", "Laura Gomez", "MANUAL"],
    [0, 38_000, "DRINKS", "Limonada de coco en la muralla", "Mario Fabian", "CHATBOT"],
  ];

  await prisma.expense.createMany({
    data: cartagenaExpenses.map(([days, amount, category, description, paidBy, source]) => ({
      tripId: cartagena.id,
      amount,
      currency: "COP",
      category,
      description,
      paidBy,
      source,
      date: dayOffset(-days),
    })),
  });

  await prisma.chatMessage.createMany({
    data: [
      { tripId: cartagena.id, role: "user", content: "Gaste en una comida", kind: "text" },
      { tripId: cartagena.id, role: "assistant", content: "¿Que comida fue? ¿Cuanto te costo?", kind: "text" },
      {
        tripId: cartagena.id,
        role: "user",
        content: "164.000 en Chuzales Cartagena",
        kind: "text",
      },
      {
        tripId: cartagena.id,
        role: "assistant",
        content:
          "Listo, registre $ 164.000 en comida (Comida en Chuzales Cartagena). Te quedan $ 1.491.000 de tu presupuesto.",
        kind: "text",
      },
    ],
  });

  /* ------------------------------------------------------------------ */
  /*  Viaje proximo: Lisboa                                              */
  /* ------------------------------------------------------------------ */

  const lisboa = await prisma.trip.create({
    data: {
      userId: user.id,
      destination: "Lisboa",
      country: "Portugal",
      budget: 2400,
      currency: "EUR",
      startDate: dayOffset(21),
      endDate: dayOffset(32),
      coverEmoji: "🇵🇹",
      notes: "Doce dias recorriendo Lisboa, Sintra y Cascais.",
      companions: {
        create: [
          { name: "Carlos Rivera", email: "carlos@example.com" },
          { name: "Sofia Nunez", email: "sofia@example.com" },
        ],
      },
    },
  });

  const lisboaExpenses: ExpenseRow[] = [
    [3, 640, "LODGING", "Apartamento en Alfama (4 noches)", "Mario Fabian", "MANUAL"],
    [2, 412, "FLIGHTS", "Vuelos ida y vuelta", "Carlos Rivera", "MANUAL"],
    [1, 96, "SIGHTSEEING", "Tour guiado a Sintra (anticipo)", "Sofia Nunez", "MANUAL"],
  ];

  await prisma.expense.createMany({
    data: lisboaExpenses.map(([days, amount, category, description, paidBy, source]) => ({
      tripId: lisboa.id,
      amount,
      currency: "EUR",
      category,
      description,
      paidBy,
      source,
      date: dayOffset(-days),
    })),
  });

  console.log("Seed completo.");
  console.log(`  Usuario: ${DEMO_EMAIL}`);
  console.log(`  Clave:   ${DEMO_PASSWORD}`);
  console.log("  Viajes:  Cartagena (en curso), Lisboa (proximo)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
