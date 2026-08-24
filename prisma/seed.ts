/**
 * Datos de demostracion: un usuario, dos viajes vigentes y gastos realistas.
 * Ejecutar con `npm run seed` (o automaticamente con `npm run setup`).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@viajero.app";
const DEMO_PASSWORD = "demo1234";

function dayOffset(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash },
    create: { email: DEMO_EMAIL, name: "Ana Martinez", passwordHash },
  });

  // Empezamos de cero para que el seed sea idempotente.
  await prisma.trip.deleteMany({ where: { userId: user.id } });

  // ---------------------------------------------------------------- Viaje 1
  // En curso: empezo hace 5 dias y termina en 6 mas.
  const lisboa = await prisma.trip.create({
    data: {
      userId: user.id,
      destination: "Lisboa",
      country: "Portugal",
      budget: 2400,
      currency: "EUR",
      startDate: dayOffset(-5),
      endDate: dayOffset(6),
      coverEmoji: "🇵🇹",
      notes: "Viaje de 12 dias recorriendo Lisboa, Sintra y Cascais.",
      companions: {
        create: [
          { name: "Carlos Rivera", email: "carlos@example.com" },
          { name: "Sofia Nunez", email: "sofia@example.com" },
        ],
      },
    },
  });

  const lisboaExpenses: [number, number, string, string, string, string][] = [
    // [diasAtras, monto, categoria, descripcion, quienPago, origen]
    [5, 640, "LODGING", "Apartamento en Alfama (4 noches)", "Ana Martinez", "MANUAL"],
    [5, 48.5, "TRANSPORT", "Taxi aeropuerto al centro", "Carlos Rivera", "MANUAL"],
    [5, 62, "FOOD", "Cena de bienvenida en Bairro Alto", "Ana Martinez", "CHATBOT"],
    [4, 26, "TRANSPORT", "Pase de metro 3 dias", "Ana Martinez", "MANUAL"],
    [4, 34.8, "FOOD", "Almuerzo en Time Out Market", "Sofia Nunez", "CHATBOT"],
    [4, 29, "ENTERTAINMENT", "Entradas Castillo de San Jorge", "Ana Martinez", "MANUAL"],
    [3, 18.4, "FOOD", "Pasteis de nata y cafe", "Carlos Rivera", "CHATBOT"],
    [3, 96, "ENTERTAINMENT", "Tour guiado a Sintra", "Ana Martinez", "MANUAL"],
    [3, 41.2, "FOOD", "Cena en Cais do Sodre", "Sofia Nunez", "MANUAL"],
    [2, 72.5, "SHOPPING", "Azulejos y souvenirs", "Ana Martinez", "MANUAL"],
    [2, 15, "TRANSPORT", "Tranvia 28 y funicular", "Carlos Rivera", "CHATBOT"],
    [2, 58.9, "FOOD", "Mariscos en Cervejaria Ramiro", "Ana Martinez", "MANUAL"],
    [1, 12.5, "HEALTH", "Farmacia: protector solar", "Sofia Nunez", "CHATBOT"],
    [1, 45, "ENTERTAINMENT", "Show de fado en Alfama", "Ana Martinez", "MANUAL"],
    [1, 31.7, "FOOD", "Desayuno y mercado de Ribeira", "Carlos Rivera", "CHATBOT"],
    [0, 24.3, "FOOD", "Almuerzo en Belem", "Ana Martinez", "CHATBOT"],
    [0, 19, "TRANSPORT", "Tren a Cascais ida y vuelta", "Ana Martinez", "MANUAL"],
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

  await prisma.chatMessage.createMany({
    data: [
      { tripId: lisboa.id, role: "user", content: "gaste 24.30 en el almuerzo en Belem" },
      {
        tripId: lisboa.id,
        role: "assistant",
        content:
          "Listo, registre 24,30 € en comida (Almuerzo en Belem). Vas en el dia 6 de 12 y te quedan 1.150 € aproximadamente.",
      },
    ],
  });

  // ---------------------------------------------------------------- Viaje 2
  // Proximo: empieza en 20 dias.
  const medellin = await prisma.trip.create({
    data: {
      userId: user.id,
      destination: "Medellin",
      country: "Colombia",
      budget: 4_500_000,
      currency: "COP",
      startDate: dayOffset(20),
      endDate: dayOffset(27),
      coverEmoji: "🇨🇴",
      notes: "Escapada de 8 dias: Comuna 13, Guatape y Parque Arvi.",
      companions: { create: [{ name: "Laura Gomez", email: "laura@example.com" }] },
    },
  });

  await prisma.expense.createMany({
    data: [
      {
        tripId: medellin.id,
        amount: 1_250_000,
        currency: "COP",
        category: "TRANSPORT",
        description: "Vuelos ida y vuelta (2 personas)",
        paidBy: "Ana Martinez",
        source: "MANUAL",
        date: dayOffset(-2),
      },
      {
        tripId: medellin.id,
        amount: 890_000,
        currency: "COP",
        category: "LODGING",
        description: "Hotel en El Poblado (anticipo)",
        paidBy: "Laura Gomez",
        source: "MANUAL",
        date: dayOffset(-1),
      },
    ],
  });

  console.log("Seed completo.");
  console.log(`  Usuario: ${DEMO_EMAIL}`);
  console.log(`  Clave:   ${DEMO_PASSWORD}`);
  console.log(`  Viajes:  Lisboa (en curso), Medellin (proximo)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
