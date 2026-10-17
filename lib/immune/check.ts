import type { AgentAction, ImmuneDecision } from "@/shared/types";
import { evaluateAction } from "@/lib/immune/evaluate";
import { listSafeguards, recordDecision } from "@/lib/immune/store";

/**
 * Check an action against the stored safeguards and add the result to the
 * decision log. Shared by POST /api/immune/check and POST /api/decisions/evaluate.
 */
export function checkAndRecord(action: AgentAction): ImmuneDecision {
  const decision = evaluateAction(action, listSafeguards());
  recordDecision({ ...decision, action, checkedAt: new Date().toISOString() });
  return decision;
}
