import type {
  AgentAction,
  CreateIncidentRequest,
  CreateSafeguardRequest,
  EvaluateRequest,
  LearnRequest,
  RiskLevel,
} from "@/shared/types";

/**
 * Runtime validation for incoming JSON. TypeScript types disappear at
 * runtime, so request bodies must be checked by hand before use.
 * Each validator returns either the typed value or an error message.
 */

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

const RISK_LEVELS: readonly RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isOptional<T>(v: unknown, check: (x: unknown) => x is T): boolean {
  return v === undefined || check(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function validateAgentAction(body: unknown): Validated<AgentAction> {
  if (!isObject(body)) return { ok: false, error: "Body must be a JSON object." };

  for (const key of ["id", "agentId", "agentName", "actionType", "reason"]) {
    if (!isNonEmptyString(body[key])) {
      return { ok: false, error: `"${key}" is required and must be a non-empty string.` };
    }
  }
  if (!isOptional(body.amount, isFiniteNumber)) {
    return { ok: false, error: `"amount" must be a number.` };
  }
  for (const key of ["customerId", "target"]) {
    if (!isOptional(body[key], isNonEmptyString)) {
      return { ok: false, error: `"${key}" must be a non-empty string.` };
    }
  }
  if (!isOptional(body.context, isObject)) {
    return { ok: false, error: `"context" must be an object.` };
  }

  return {
    ok: true,
    value: {
      id: body.id as string,
      agentId: body.agentId as string,
      agentName: body.agentName as string,
      actionType: body.actionType as string,
      reason: body.reason as string,
      amount: body.amount as number | undefined,
      customerId: body.customerId as string | undefined,
      target: body.target as string | undefined,
      context: body.context as Record<string, unknown> | undefined,
    },
  };
}

export function validateCreateSafeguard(
  body: unknown,
): Validated<CreateSafeguardRequest> {
  if (!isObject(body)) return { ok: false, error: "Body must be a JSON object." };

  for (const key of ["name", "category", "reason"]) {
    if (!isNonEmptyString(body[key])) {
      return { ok: false, error: `"${key}" is required and must be a non-empty string.` };
    }
  }
  if (body.response !== "BLOCK" && body.response !== "REVIEW") {
    return { ok: false, error: `"response" must be "BLOCK" or "REVIEW".` };
  }
  for (const key of ["id", "actionType", "learnedFromIncident", "policyId"]) {
    if (!isOptional(body[key], isNonEmptyString)) {
      return { ok: false, error: `"${key}" must be a non-empty string.` };
    }
  }
  if (!isOptional(body.threshold, isFiniteNumber)) {
    return { ok: false, error: `"threshold" must be a number.` };
  }
  if (
    body.riskLevel !== undefined &&
    !RISK_LEVELS.includes(body.riskLevel as RiskLevel)
  ) {
    return { ok: false, error: `"riskLevel" must be one of ${RISK_LEVELS.join(", ")}.` };
  }

  return {
    ok: true,
    value: {
      id: body.id as string | undefined,
      name: body.name as string,
      category: body.category as string,
      actionType: body.actionType as string | undefined,
      threshold: body.threshold as number | undefined,
      response: body.response,
      reason: body.reason as string,
      riskLevel: body.riskLevel as RiskLevel | undefined,
      learnedFromIncident: body.learnedFromIncident as string | undefined,
      policyId: body.policyId as string | undefined,
    },
  };
}

export function validateCreateIncident(
  body: unknown,
): Validated<CreateIncidentRequest> {
  if (!isObject(body)) return { ok: false, error: "Body must be a JSON object." };

  if (!isNonEmptyString(body.description)) {
    return { ok: false, error: `"description" is required and must be a non-empty string.` };
  }
  if (!isOptional(body.id, isNonEmptyString)) {
    return { ok: false, error: `"id" must be a non-empty string.` };
  }
  const action = validateAgentAction(body.action);
  if (!action.ok) return { ok: false, error: `Invalid "action": ${action.error}` };

  return {
    ok: true,
    value: {
      id: body.id as string | undefined,
      description: body.description as string,
      action: action.value,
    },
  };
}

/* Frontend contract (docs/IMMUNE_FRONTEND_INTEGRATION.md) -------------- */

export function validateEvaluateRequest(body: unknown): Validated<EvaluateRequest> {
  if (!isObject(body)) return { ok: false, error: "Body must be a JSON object." };

  for (const key of ["agentId", "action"]) {
    if (!isNonEmptyString(body[key])) {
      return { ok: false, error: `"${key}" is required and must be a non-empty string.` };
    }
  }
  if (!isOptional(body.amount, isFiniteNumber)) {
    return { ok: false, error: `"amount" must be a number.` };
  }
  if (!isOptional(body.currency, isNonEmptyString)) {
    return { ok: false, error: `"currency" must be a non-empty string.` };
  }

  return {
    ok: true,
    value: {
      agentId: body.agentId as string,
      action: body.action as string,
      amount: body.amount as number | undefined,
      currency: body.currency as string | undefined,
    },
  };
}

export function validateLearnRequest(body: unknown): Validated<LearnRequest> {
  if (!isObject(body)) return { ok: false, error: "Body must be a JSON object." };

  const incident = body.incident;
  if (!isObject(incident)) {
    return { ok: false, error: `"incident" is required and must be an object.` };
  }
  for (const key of ["agentId", "action", "summary"]) {
    if (!isNonEmptyString(incident[key])) {
      return { ok: false, error: `"incident.${key}" is required and must be a non-empty string.` };
    }
  }
  if (!isOptional(incident.amount, isFiniteNumber)) {
    return { ok: false, error: `"incident.amount" must be a number.` };
  }
  if (!isOptional(incident.currency, isNonEmptyString)) {
    return { ok: false, error: `"incident.currency" must be a non-empty string.` };
  }

  let safeguard: LearnRequest["safeguard"];
  if (body.safeguard !== undefined) {
    const s = body.safeguard;
    if (!isObject(s)) return { ok: false, error: `"safeguard" must be an object.` };
    for (const key of ["title", "detail"]) {
      if (!isNonEmptyString(s[key])) {
        return { ok: false, error: `"safeguard.${key}" is required and must be a non-empty string.` };
      }
    }
    if (s.outcome !== "BLOCK" && s.outcome !== "REVIEW") {
      return { ok: false, error: `"safeguard.outcome" must be "BLOCK" or "REVIEW".` };
    }
    for (const key of ["id", "action"]) {
      if (!isOptional(s[key], isNonEmptyString)) {
        return { ok: false, error: `"safeguard.${key}" must be a non-empty string.` };
      }
    }
    if (!isOptional(s.active, (v): v is boolean => typeof v === "boolean")) {
      return { ok: false, error: `"safeguard.active" must be true or false.` };
    }
    let condition: NonNullable<LearnRequest["safeguard"]>["condition"];
    if (s.condition !== undefined) {
      const c = s.condition;
      if (
        !isObject(c) ||
        c.field !== "amount" ||
        c.operator !== "greater_than" ||
        !isFiniteNumber(c.value)
      ) {
        return {
          ok: false,
          error: `"safeguard.condition" must be { "field": "amount", "operator": "greater_than", "value": <number> }.`,
        };
      }
      condition = { field: "amount", operator: "greater_than", value: c.value };
    }
    safeguard = {
      id: s.id as string | undefined,
      title: s.title as string,
      detail: s.detail as string,
      action: s.action as string | undefined,
      condition,
      outcome: s.outcome,
      active: s.active as boolean | undefined,
    };
  }

  return {
    ok: true,
    value: {
      incident: {
        agentId: incident.agentId as string,
        action: incident.action as string,
        amount: incident.amount as number | undefined,
        currency: incident.currency as string | undefined,
        summary: incident.summary as string,
      },
      safeguard,
    },
  };
}
