import type { Incident, Safeguard } from "@/shared/types";

/**
 * Built-in, deterministic "learning": turns a reviewed incident into a
 * reusable safeguard with fixed rules. No LLM. This is the fallback the
 * demo uses when POST /api/incidents/learn is called without a `safeguard`
 * (Nithin's LLM step can pass its own rule instead).
 *
 * - Action with a known amount limit (refund: $500) -> REVIEW above the limit.
 *   Wording matches Nithin's dashboard.
 * - Any other action -> BLOCK that action type.
 *
 * The id is fixed per rule, so learning the same lesson twice returns the
 * existing safeguard instead of a duplicate.
 */

type LimitRule = {
  limit: number;
  title: string;
  detail: string;
  category: string;
  policyId?: string;
};

const AMOUNT_LIMITS: Record<string, LimitRule> = {
  refund: {
    limit: 500,
    title: "High-value refunds need human review",
    detail: "Refunds above $500 must be reviewed by a person before approval.",
    category: "financial_fraud",
    policyId: "HIGH_VALUE_REFUND", // Varad's security/policies.ts
  },
};

const BLOCK_RULES: Record<string, { title: string; detail: string; category: string; policyId?: string }> = {
  change_refund_destination: {
    title: "Block refund destination changes",
    detail: "Only use the verified original payment method; refund destination changes are blocked.",
    category: "financial_fraud",
    policyId: "REFUND_DESTINATION", // Varad's security/policies.ts
  },
};

function words(actionType: string): string {
  return actionType.replace(/[_-]+/g, " ");
}

/** Stable id for a learned rule: same lesson -> same id. */
export function ruleId(actionType: string, outcome: "BLOCK" | "REVIEW", threshold?: number): string {
  const key = actionType.toLowerCase();
  return `sg-learned-${key}-${outcome.toLowerCase()}${threshold !== undefined ? `-${threshold}` : ""}`;
}

/** The id the built-in learned rule for this action type will have. */
export function learnedSafeguardId(actionType: string): string {
  const limit = AMOUNT_LIMITS[actionType.toLowerCase()];
  return limit ? ruleId(actionType, "REVIEW", limit.limit) : ruleId(actionType, "BLOCK");
}

export function learnSafeguard(incident: Incident): Safeguard {
  const actionType = incident.action.actionType;
  const key = actionType.toLowerCase();
  const createdAt = new Date().toISOString();
  const limit = AMOUNT_LIMITS[key];

  if (limit) {
    return {
      id: learnedSafeguardId(actionType),
      name: limit.title,
      category: limit.category,
      actionType: key,
      threshold: limit.limit,
      response: "REVIEW",
      riskLevel: "HIGH",
      reason: limit.detail,
      learnedFromIncident: incident.id,
      ...(limit.policyId && { policyId: limit.policyId }),
      createdAt,
    };
  }

  const known = BLOCK_RULES[key];
  return {
    id: learnedSafeguardId(actionType),
    name: known?.title ?? `Block ${words(key)}`,
    category: known?.category ?? "learned",
    actionType: key,
    response: "BLOCK",
    riskLevel: "CRITICAL",
    reason: known?.detail ?? `Agents may not ${words(key)} after a reviewed incident: ${incident.description}`,
    learnedFromIncident: incident.id,
    ...(known?.policyId && { policyId: known.policyId }),
    createdAt,
  };
}
