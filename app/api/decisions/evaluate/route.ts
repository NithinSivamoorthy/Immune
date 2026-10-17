import type { EvaluateResponse } from "@/shared/types";
import { checkAndRecord } from "@/lib/immune/check";
import { errorResponse, readJson } from "@/lib/immune/http";
import { validateEvaluateRequest } from "@/lib/immune/validate";

/**
 * POST /api/decisions/evaluate
 * The "check a proposed agent action" call from Nithin's
 * docs/IMMUNE_FRONTEND_INTEGRATION.md, in his exact shape.
 *
 * Body:    { agentId, action, amount?, currency? }
 * Returns: { decision, reason, matchedSafeguardId? } (200); 400 for bad input.
 *
 * Same enforcement and decision log as POST /api/immune/check.
 * Amounts are treated as USD; `currency` is accepted but not converted.
 */
export async function POST(request: Request) {
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const input = validateEvaluateRequest(parsed.body);
  if (!input.ok) return errorResponse(400, input.error);

  const { agentId, action, amount, currency } = input.value;
  const decision = checkAndRecord({
    id: `act_${crypto.randomUUID()}`,
    agentId,
    agentName: agentId,
    actionType: action,
    ...(amount !== undefined && { amount }),
    reason: "Proposed action sent to /api/decisions/evaluate",
    ...(currency !== undefined && { context: { currency } }),
  });

  const body: EvaluateResponse = {
    decision: decision.decision,
    reason: decision.reason,
    ...(decision.safeguardId !== undefined && { matchedSafeguardId: decision.safeguardId }),
  };
  return Response.json(body);
}
