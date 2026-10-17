/**
 * IMMUNE shared types.
 *
 * Single source of truth for the JSON shapes exchanged between agents, the
 * frontend, and the IMMUNE backend API. Import with:
 *
 *   import type { AgentAction, ImmuneDecision } from "@/shared/types";
 *
 * Types only: no runtime code lives in this file.
 */

/** The three outcomes IMMUNE can return for a proposed action. */
export type Decision = "ALLOW" | "BLOCK" | "REVIEW";

/** A safeguard can only ever escalate an action, never allow it. */
export type SafeguardResponse = Exclude<Decision, "ALLOW">;

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** An action an agent proposes, sent to IMMUNE before it is executed. */
export type AgentAction = {
  id: string;
  agentId: string;
  agentName: string;
  /** e.g. "refund", "delete_account", "send_email" */
  actionType: string;
  /** Money amount in dollars, when the action involves money. */
  amount?: number;
  customerId?: string;
  target?: string;
  /** The agent's own justification for the action. */
  reason: string;
  context?: Record<string, unknown>;
};

/** IMMUNE's verdict on a single AgentAction. */
export type ImmuneDecision = {
  decision: Decision;
  reason: string;
  riskLevel: RiskLevel;
  /** Id of the AgentAction this decision is for. */
  actionId: string;
  /** Id of the safeguard that triggered BLOCK/REVIEW. Absent on ALLOW. */
  safeguardId?: string;
};

/**
 * A stored, reusable rule enforced deterministically on every action check.
 *
 * Matching (see lib/immune/evaluate.ts):
 * - `actionType` set   -> only applies to actions with that actionType
 *                         (case-insensitive). Unset -> applies to all types.
 * - `threshold` set    -> only triggers when action.amount > threshold.
 *                         Actions with no amount never trigger it.
 * - If several safeguards match, BLOCK wins over REVIEW.
 */
export type Safeguard = {
  id: string;
  name: string;
  /** Free-form grouping label, e.g. "financial_fraud". Not used for matching. */
  category: string;
  actionType?: string;
  threshold?: number;
  response: SafeguardResponse;
  reason: string;
  /** Risk reported when this safeguard triggers. Defaults: BLOCK -> HIGH, REVIEW -> MEDIUM. */
  riskLevel?: RiskLevel;
  /** Id of the Incident this safeguard was learned from, if any. */
  learnedFromIncident?: string;
  /**
   * Matching policy id in Varad's Fire Drill engine (security/policies.ts),
   * e.g. "DATA_PRIVACY", so the UI can show both layers together.
   */
  policyId?: string;
  /** ISO 8601 timestamp, set by the server. */
  createdAt: string;
};

/** A record of an agent action that went wrong. */
export type Incident = {
  id: string;
  action: AgentAction;
  description: string;
  /** ISO 8601 timestamp, set by the server. */
  createdAt: string;
};

/* ------------------------------------------------------------------ */
/* API request / response shapes                                       */
/* ------------------------------------------------------------------ */

/** POST /api/immune/check  — body: AgentAction, response: ImmuneDecision */
export type CheckActionRequest = AgentAction;
export type CheckActionResponse = ImmuneDecision;

/** POST /api/safeguards — server fills in id (if omitted) and createdAt. */
export type CreateSafeguardRequest = Omit<Safeguard, "id" | "createdAt"> & {
  id?: string;
};

/** POST /api/incidents — server fills in id (if omitted) and createdAt. */
export type CreateIncidentRequest = Omit<Incident, "id" | "createdAt"> & {
  id?: string;
};

/** One entry in the decision log. GET /api/immune/decisions returns these, newest first. */
export type DecisionLogEntry = ImmuneDecision & {
  action: AgentAction;
  /** ISO 8601 timestamp, set by the server. */
  checkedAt: string;
};

/** POST /api/immune/reset — response. */
export type ResetResponse = {
  safeguards: number;
  incidents: number;
  decisions: number;
};

/* ------------------------------------------------------------------ */
/* Frontend contract (docs/IMMUNE_FRONTEND_INTEGRATION.md, Nithin)     */
/* ------------------------------------------------------------------ */

/** A safeguard in the shape Nithin's dashboard uses. */
export type FrontendSafeguard = {
  id: string;
  title: string;
  detail: string;
  action?: string;
  condition?: { field: "amount"; operator: "greater_than"; value: number };
  outcome: SafeguardResponse;
  active: boolean;
};

/** POST /api/decisions/evaluate — request. */
export type EvaluateRequest = {
  agentId: string;
  action: string;
  amount?: number;
  currency?: string;
};

/** POST /api/decisions/evaluate — response. `matchedSafeguardId` absent on ALLOW. */
export type EvaluateResponse = {
  decision: Decision;
  reason: string;
  matchedSafeguardId?: string;
};

/** POST /api/incidents/learn — request. */
export type LearnRequest = {
  incident: {
    agentId: string;
    action: string;
    amount?: number;
    currency?: string;
    summary: string;
  };
  /**
   * Optional rule to store instead of the built-in one, e.g. produced by the
   * LLM. Same shape as FrontendSafeguard, `id` and `active` optional.
   */
  safeguard?: Omit<FrontendSafeguard, "id" | "active"> & { id?: string; active?: boolean };
};

/** POST /api/incidents/learn — response. */
export type LearnResponse = {
  safeguard: FrontendSafeguard;
  incidentId: string;
};

/** Returned with a 4xx/5xx status when a request fails. */
export type ApiError = {
  error: string;
};
