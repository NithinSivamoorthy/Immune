import type {
  AgentAction,
  CreateIncidentRequest,
  CreateSafeguardRequest,
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
  for (const key of ["id", "actionType", "learnedFromIncident"]) {
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
