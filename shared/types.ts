/**
 * IMMUNE shared types.
 *
 * Single source of truth for the JSON shapes exchanged between agents, the
 * frontend, and the IMMUNE backend API. Import with:
 *
 *   import type { AgentAction, ImmuneDecision } from "@/shared/types";
 *
 * Includes the canonical action vocabulary used by runtime validators.
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
  actionType: ActionType;
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
  actionType?: ActionType;
  threshold?: number;
  response: SafeguardResponse;
  reason: string;
  /** Risk reported when this safeguard triggers. Defaults: BLOCK -> HIGH, REVIEW -> MEDIUM. */
  riskLevel?: RiskLevel;
  /** Id of the Incident this safeguard was learned from, if any. */
  learnedFromIncident?: string;
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

/** Returned with a 4xx/5xx status when a request fails. */
export type ApiError = {
  error: string;
};

/** Canonical structured operations; prompts are never enforcement inputs. */
export const ACTION_TYPES = ["refund", "change_refund_destination", "change_email", "share_customer_data", "override_policy", "modify_account", "repeat_refund", "execute_unverified_instruction", "read_policy"] as const;
export type ActionType = typeof ACTION_TYPES[number];
export type Business = { id: string; name: string; industry: string };
export type Agent = { id: string; businessId: string; name: string; role: string; status: "ACTIVE"; immuneEnabled: boolean; actionsChecked: number; blockedActions: number; reviewActions: number; incidents: number; lastActionAt?: string };
export type ActivityEvent = { id: string; businessId: string; agentId?: string; type: "ACTION_ALLOWED" | "ACTION_REVIEW" | "ACTION_BLOCKED" | "INCIDENT_REPORTED" | "SAFEGUARD_LEARNED" | "FIRE_DRILL_STARTED" | "FIRE_DRILL_WEAKNESS_FOUND" | "FIRE_DRILL_SAFEGUARD_CREATED" | "FIRE_DRILL_RETEST_PASSED"; message: string; createdAt: string };
export type FireDrillResult = { id: string; runId: string; scenarioId: string; name: string; agentId: string; action: AgentAction; expectedOutcome: Decision; actualDecision: Decision; passed: boolean; weakness: boolean; riskLevel: RiskLevel; finding: string; incidentId?: string; safeguardId?: string; retestDecision?: Decision; retestPassed?: boolean; error?: string; selected: boolean; learningStatus: "NOT_SELECTED" | "PENDING" | "LEARNING" | "COMPLETE" | "ERROR" };
export type FireDrillRun = { id: string; businessId: string; startedAt: string; completedAt?: string; status: "ASSESSING" | "ASSESSED" | "LEARNING" | "COMPLETE" | "ERROR"; scenarioCount: number; passedCount: number; failedCount: number; safeguardsCreated: number; learningLimit: number; results: FireDrillResult[]; error?: string };
export type WorkspaceSettings = { nextFireDrillAt: string; learningLimit: number };
export type DashboardSnapshot = { businesses: Business[]; agents: Agent[]; activity: ActivityEvent[]; incidents: Incident[]; safeguards: Safeguard[]; runs: FireDrillRun[]; settings: WorkspaceSettings; metrics: Record<string, number> };
