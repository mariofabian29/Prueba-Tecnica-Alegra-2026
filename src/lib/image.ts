"use client";

/**
 * Reducción de la foto del recibo antes de subirla.
 *
 * Los recibos se guardan en la base de datos como data URI, así que la app
 * funciona en cualquier hosting sin depender de un disco escribible ni de un
 * servicio de almacenamiento aparte. Para que eso sea viable, la imagen se
 * reduce en el navegador: una foto de móvil de 4 MB baja a unos 200 KB sin que
 * el total del recibo deje de leerse.
 */

const MAX_SIDE = 1400;
const QUALITY = 0.82;

export type PreparedImage = { blob: Blob; type: string; width: number; height: number };

export async function prepareReceipt(file: File): Promise<PreparedImage> {
  // Si el navegador no puede procesarla, se sube tal cual.
  if (typeof createImageBitmap !== "function" || !file.type.startsWith("image/")) {
    return { blob: file, type: file.type, width: 0, height: 0 };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return { blob: file, type: file.type, width: 0, height: 0 };

    // Fondo blanco: los recibos suelen ser papel y evita transparencias en JPEG.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );

    // Si la reducción no ayuda, nos quedamos con el original.
    if (!blob || blob.size >= file.size) {
      return { blob: file, type: file.type, width, height };
    }
    return { blob, type: "image/jpeg", width, height };
  } catch {
    return { blob: file, type: file.type, width: 0, height: 0 };
  }
}
