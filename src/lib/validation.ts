import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";
import { CURRENCIES } from "@/lib/format";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(60),
    email: z.string().trim().toLowerCase().email("Correo inválido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(100, "La contraseña no puede superar los 100 caracteres"),
    confirmPassword: z.string().optional(),
  })
  .refine((d) => !d.confirmPassword || d.confirmPassword === d.password, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const tripSchema = z
  .object({
    destination: z.string().trim().min(2, "Indica el destino").max(80),
    country: z.string().trim().max(60).optional().or(z.literal("")),
    budget: z.coerce.number().positive("El presupuesto debe ser mayor a 0").max(100_000_000),
    currency: z.enum(CURRENCIES),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de inicio inválida"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de fin inválida"),
    // Las fechas son opcionales en el formulario: si faltan, la API rellena una
    // ventana por defecto de 7 días desde hoy antes de validar.
    notes: z.string().trim().max(500).optional().or(z.literal("")),
    coverEmoji: z.string().trim().max(8).optional().or(z.literal("")),
    companions: z
      .array(z.object({ name: z.string().trim().min(1).max(60), email: z.string().trim().email().optional().or(z.literal("")) }))
      .max(15)
      .optional(),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: "La fecha de fin no puede ser anterior a la de inicio",
    path: ["endDate"],
  })
  .refine((d) => new Date(`${d.endDate}T23:59:59`) >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: "No se pueden crear viajes que ya terminaron",
    path: ["endDate"],
  });

export const expenseSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0").max(100_000_000),
  category: z.enum(CATEGORIES),
  description: z.string().trim().min(1, "Describe el gasto").max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  paidBy: z.string().trim().min(1).max(60).default("Yo"),
  splitMode: z.enum(["NONE", "EQUAL"]).default("NONE"),
  place: z.string().trim().max(120).optional().or(z.literal("")),
  receiptUrl: z.string().trim().max(300).optional().or(z.literal("")),
  source: z.enum(["MANUAL", "CHATBOT"]).default("MANUAL"),
});

export const chatSchema = z.object({
  message: z.string().trim().min(1, "Escribe un mensaje").max(600),
});

export function zodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
