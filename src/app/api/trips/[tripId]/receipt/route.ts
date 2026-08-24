import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { isSupportedMediaType, readReceipt } from "@/lib/ai/receipt";

type Params = { params: Promise<{ tripId: string }> };

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Sube la foto de un recibo, la guarda en /public/uploads y pide a la IA que
 * extraiga monto, categoria y fecha. Devuelve un borrador para confirmar.
 */
export async function POST(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { tripId } = await params;

    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId: user.id } });
    if (!trip) return fail("El viaje no existe o no te pertenece", 404);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No se recibio ninguna imagen", 400);
    if (file.size === 0) return fail("La imagen esta vacia", 400);
    if (file.size > MAX_BYTES) return fail("La imagen supera el limite de 8 MB", 413);
    if (!isSupportedMediaType(file.type)) {
      return fail("Formato no soportado. Usa JPG, PNG, WEBP o GIF.", 415);
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.${EXTENSIONS[file.type]}`;
    await writeFile(path.join(dir, filename), bytes);
    const receiptUrl = `/uploads/${filename}`;

    const draft = await readReceipt(bytes.toString("base64"), file.type, trip.currency);

    // La foto queda en el historial del chat aunque el gasto no se confirme.
    await prisma.chatMessage.create({
      data: {
        tripId,
        role: "user",
        content: "Foto del recibo",
        kind: "receipt",
        payload: JSON.stringify({ receiptUrl }),
      },
    });

    const message = draft.extracted
      ? "Confirma la informacion y la cargo automaticamente"
      : "No pude leer el total del recibo. Escribeme el monto y lo registro con esta foto.";

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        tripId,
        role: "assistant",
        content: message,
        kind: draft.extracted ? "draft" : "text",
        payload: draft.extracted ? JSON.stringify({ ...draft, receiptUrl }) : null,
      },
    });

    return ok({ receiptUrl, draft, assistantMessage, extracted: draft.extracted }, 201);
  });
}
