import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { resolveDestinationPhoto } from "@/lib/photos";

type Params = { params: Promise<{ tripId: string }> };

/**
 * Resuelve y guarda la foto del destino. Es idempotente: si el viaje ya tiene
 * una, la devuelve sin volver a consultar.
 */
export async function POST(_request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { tripId } = await params;

    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId: user.id } });
    if (!trip) return fail("El viaje no existe o no te pertenece", 404);
    if (trip.photoUrl) return ok({ photoUrl: trip.photoUrl, cached: true });

    const photoUrl = await resolveDestinationPhoto(trip.destination, trip.country);
    if (!photoUrl) return ok({ photoUrl: null, cached: false });

    await prisma.trip.update({ where: { id: tripId }, data: { photoUrl } });
    return ok({ photoUrl, cached: false });
  });
}
