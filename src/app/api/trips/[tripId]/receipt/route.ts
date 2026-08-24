import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { isSupportedMediaType, readReceipt } from "@/lib/ai/receipt";

type Params = { params: Promise<{ tripId: string }> };

/**
 * Límite del archivo ya reducido en el navegador. Se guarda como data URI en
 * la base de datos, de modo que la app no depende de un disco escribible y
 * funciona igual en local que en un hosting sin sistema de archivos.
 */
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { tripId } = await params;

    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId: user.id } });
    if (!trip) return fail("El viaje no existe o no te pertenece", 404);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No se recibió ninguna imagen", 400);
    if (file.size === 0) return fail("La imagen está vacía", 400);
    if (file.size > MAX_BYTES) {
      return fail("La imagen es demasiado grande. Prueba con una foto más ligera.", 413);
    }
    if (!isSupportedMediaType(file.type)) {
      return fail("Formato no soportado. Usa JPG, PNG, WEBP o GIF.", 415);
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const receiptUrl = `data:${file.type};base64,${base64}`;

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

    const draft = await readReceipt(base64, file.type, trip.currency);

    const message = draft.extracted
      ? "Confirma la información y la cargo automáticamente"
      : "No pude leer el total del recibo. Escríbeme el monto y lo registro con esta foto.";

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
