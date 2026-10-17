import type { Incident, LearnResponse } from "@/shared/types";
import { fromFrontendSafeguard, toFrontendSafeguard } from "@/lib/immune/frontend";
import { errorResponse, readJson } from "@/lib/immune/http";
import { learnSafeguard, ruleId } from "@/lib/immune/learn";
import { addIncident, addSafeguard, getSafeguard } from "@/lib/immune/store";
import { validateLearnRequest } from "@/lib/immune/validate";

/**
 * POST /api/incidents/learn
 * The "learn from a reviewed incident" call from Nithin's
 * docs/IMMUNE_FRONTEND_INTEGRATION.md, in his exact shape.
 *
 * Body:    { incident: { agentId, action, amount?, currency?, summary }, safeguard? }
 * Returns: { safeguard, incidentId } (201 new rule, 200 rule already existed); 400 bad input.
 *
 * Stores the incident, then stores a safeguard:
 * - `safeguard` given (e.g. from the LLM) -> that rule is stored.
 * - otherwise -> the built-in rule from lib/immune/learn.ts.
 * Learning the same rule twice returns the existing one (safe to re-run the demo).
 */
export async function POST(request: Request) {
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const input = validateLearnRequest(parsed.body);
  if (!input.ok) return errorResponse(400, input.error);

  const { incident: raw, safeguard: suggested } = input.value;
  const incident: Incident = {
    id: `inc_${crypto.randomUUID()}`,
    description: raw.summary,
    action: {
      id: `act_${crypto.randomUUID()}`,
      agentId: raw.agentId,
      agentName: raw.agentId,
      actionType: raw.action,
      ...(raw.amount !== undefined && { amount: raw.amount }),
      reason: raw.summary,
      ...(raw.currency !== undefined && { context: { currency: raw.currency } }),
    },
    createdAt: new Date().toISOString(),
  };
  addIncident(incident);

  const candidate = suggested
    ? fromFrontendSafeguard(
        suggested,
        ruleId(suggested.action ?? raw.action, suggested.outcome, suggested.condition?.value),
        incident.id,
      )
    : learnSafeguard(incident);

  const existing = getSafeguard(candidate.id);
  const stored = existing ?? candidate;
  if (!existing) addSafeguard(candidate);

  const body: LearnResponse = { safeguard: toFrontendSafeguard(stored), incidentId: incident.id };
  return Response.json(body, { status: existing ? 200 : 201 });
}
