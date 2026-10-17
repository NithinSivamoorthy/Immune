import type {
  AgentAction,
  ImmuneDecision,
  RiskLevel,
  Safeguard,
} from "@/shared/types";

/**
 * Deterministic IMMUNE enforcement. No LLM, no I/O: the same action and
 * safeguards always produce the same decision.
 */

const DEFAULT_RISK: Record<Safeguard["response"], RiskLevel> = {
  BLOCK: "HIGH",
  REVIEW: "MEDIUM",
};

/** Does this safeguard apply to this action? */
export function safeguardMatches(
  safeguard: Safeguard,
  action: AgentAction,
): boolean {
  if (
    safeguard.actionType !== undefined &&
    safeguard.actionType.toLowerCase() !== action.actionType.toLowerCase()
  ) {
    return false;
  }

  if (safeguard.threshold !== undefined) {
    if (typeof action.amount !== "number") return false;
    if (!(action.amount > safeguard.threshold)) return false;
  }

  return true;
}

/**
 * Check an action against all safeguards.
 * - No match           -> ALLOW / LOW
 * - Any BLOCK match    -> BLOCK (first BLOCK safeguard in list order)
 * - Only REVIEW match  -> REVIEW (first REVIEW safeguard in list order)
 */
export function evaluateAction(
  action: AgentAction,
  safeguards: readonly Safeguard[],
): ImmuneDecision {
  const matches = safeguards.filter((s) => safeguardMatches(s, action));
  const winner =
    matches.find((s) => s.response === "BLOCK") ??
    matches.find((s) => s.response === "REVIEW");

  if (!winner) {
    return {
      decision: "ALLOW",
      reason: "No safeguard matched this action.",
      riskLevel: "LOW",
      actionId: action.id,
    };
  }

  return {
    decision: winner.response,
    reason: winner.reason,
    riskLevel: winner.riskLevel ?? DEFAULT_RISK[winner.response],
    actionId: action.id,
    safeguardId: winner.id,
  };
}
