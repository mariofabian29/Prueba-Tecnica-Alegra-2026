"use client";

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
  return (
    <AppShell userName={userName} active="assistant" activeTripId={tripId}>
      <Assistant tripId={tripId} destination={destination} currency={currency} />
    </AppShell>
  );
}
