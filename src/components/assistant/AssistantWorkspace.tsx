"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Assistant } from "./Assistant";

export function AssistantWorkspace({
  userName,
  tripId,
  destination,
  currency,
}: {
  userName: string;
  tripId: string;
  destination: string;
  currency: string;
}) {
  const router = useRouter();

  return (
    <AppShell
      userName={userName}
      active="assistant"
      budgetHref={`/viajes/${tripId}`}
      onAssistant={() => router.refresh()}
    >
      <Assistant tripId={tripId} destination={destination} currency={currency} />
    </AppShell>
  );
}
