import { getSession } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

export async function GET() {
  return handle(async () => {
    const session = await getSession();
    return ok({ user: session });
  });
}
