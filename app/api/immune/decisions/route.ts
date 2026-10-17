import { connection } from "next/server";
import { listDecisions } from "@/lib/immune/store";

/**
 * GET /api/immune/decisions
 * Returns: DecisionLogEntry[] (200), newest first, up to the last 200 checks.
 * Each entry = the ImmuneDecision + the action that was checked + checkedAt.
 */
export async function GET() {
  // Force request time (see note in app/api/safeguards/route.ts).
  await connection();
  return Response.json(listDecisions());
}
