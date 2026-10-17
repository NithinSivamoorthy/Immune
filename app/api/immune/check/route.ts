import type { CheckActionResponse } from "@/shared/types";
import { checkAndRecord } from "@/lib/immune/check";
import { errorResponse, readJson } from "@/lib/immune/http";
import { validateAgentAction } from "@/lib/immune/validate";

/**
 * POST /api/immune/check
 * Body: AgentAction. Returns: ImmuneDecision (200).
 * Always 200 for a valid action, whatever the decision; 400 for bad input.
 * Every decision is also added to the log (GET /api/immune/decisions).
 */
export async function POST(request: Request) {
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const action = validateAgentAction(parsed.body);
  if (!action.ok) return errorResponse(400, action.error);

  const decision: CheckActionResponse = checkAndRecord(action.value);
  return Response.json(decision);
}
