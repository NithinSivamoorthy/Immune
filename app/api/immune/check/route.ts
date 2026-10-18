import { findAgent, recordCheck } from "@/lib/dashboard/store";
import type { CheckActionResponse } from "@/shared/types";
import { evaluateAction } from "@/lib/immune/evaluate";
import { errorResponse, readJson } from "@/lib/immune/http";
import { listSafeguards } from "@/lib/immune/store";
import { validateAgentAction } from "@/lib/immune/validate";

/**
 * POST /api/immune/check
 * Body: AgentAction. Returns: ImmuneDecision (200).
 * Always 200 for a valid action, whatever the decision; 400 for bad input.
 */
export async function POST(request: Request) {
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const action = validateAgentAction(parsed.body);
  if (!action.ok) return errorResponse(400, action.error);

  const agent = findAgent(action.value.agentId);
  if (agent && !agent.immuneEnabled) return errorResponse(409, "IMMUNE is disabled for this demo agent. Enable it before checking actions.");
  const decision: CheckActionResponse = evaluateAction(action.value, listSafeguards());
  recordCheck(action.value, decision);
  return Response.json(decision);
}
