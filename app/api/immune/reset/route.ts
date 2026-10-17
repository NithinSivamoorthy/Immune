import type { ResetResponse } from "@/shared/types";
import { resetStore } from "@/lib/immune/store";

/**
 * POST /api/immune/reset
 * Puts the demo back to its starting state: only the starting safeguards,
 * no incidents, empty decision log. Use between demo runs instead of
 * restarting the server. Returns the counts after reset (200).
 */
export async function POST() {
  const store = resetStore();
  const body: ResetResponse = {
    safeguards: store.safeguards.length,
    incidents: store.incidents.length,
    decisions: store.decisions.length,
  };
  return Response.json(body);
}
