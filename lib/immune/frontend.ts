import type { FrontendSafeguard, LearnRequest, Safeguard } from "@/shared/types";

/**
 * Converts between the backend's Safeguard and the FrontendSafeguard shape
 * Nithin's dashboard uses (docs/IMMUNE_FRONTEND_INTEGRATION.md).
 */

export function toFrontendSafeguard(s: Safeguard): FrontendSafeguard {
  return {
    id: s.id,
    title: s.name,
    detail: s.reason,
    ...(s.actionType !== undefined && { action: s.actionType }),
    ...(s.threshold !== undefined && {
      condition: { field: "amount" as const, operator: "greater_than" as const, value: s.threshold },
    }),
    outcome: s.response,
    active: true,
  };
}

/** A rule supplied in LearnRequest.safeguard (e.g. from the LLM) -> backend Safeguard. */
export function fromFrontendSafeguard(
  input: NonNullable<LearnRequest["safeguard"]>,
  fallbackId: string,
  incidentId: string,
): Safeguard {
  return {
    id: input.id ?? fallbackId,
    name: input.title,
    category: "learned",
    ...(input.action !== undefined && { actionType: input.action }),
    ...(input.condition !== undefined && { threshold: input.condition.value }),
    response: input.outcome,
    reason: input.detail,
    learnedFromIncident: incidentId,
    createdAt: new Date().toISOString(),
  };
}
