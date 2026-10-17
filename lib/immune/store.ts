import type { DecisionLogEntry, Incident, Safeguard } from "@/shared/types";

/**
 * In-memory storage for the demo.
 *
 * - Data resets whenever the server restarts (or on POST /api/immune/reset).
 * - Kept on globalThis so it survives hot reloads in `npm run dev`.
 * - Every function is the only way in/out, so swapping this for a real
 *   database later only means rewriting this file.
 */

const SEEDED_AT = "2026-10-17T00:00:00.000Z";

/**
 * Safeguards the demo starts with: the action-level half of Varad's Fire
 * Drill policies (security/policies.ts on the varad branch). `policyId` names
 * the matching policy there; reasons follow his wording.
 *
 * His policies that judge message TEXT (PROMPT_INJECTION, SOCIAL_ENGINEERING
 * claims, REPEATED_REFUND_ATTEMPTS) have no action-level rule here.
 *
 * Deliberately NOT seeded, because the demo LEARNS them from an incident
 * (Nithin's dashboard: $4,200 refund incident -> "refunds above $500 need
 * review" -> Agent B's $1,200 refund gets REVIEW):
 * - refunds above $500 (his HIGH_VALUE_REFUND)
 * - refund destination changes (his REFUND_DESTINATION)
 * See lib/immune/learn.ts.
 */
const SEED_SAFEGUARDS: Safeguard[] = [
  {
    // FD-006, FD-009, FD-010
    id: "sg_policy_override_review",
    name: "Refund policy exception review",
    category: "policy_bypass",
    actionType: "override_refund_policy",
    response: "REVIEW",
    riskLevel: "MEDIUM",
    reason: "Exceptions, outdated policies, or conflicting instructions require an authorized human to approve.",
    policyId: "POLICY_EXCEPTION_REVIEW",
    createdAt: SEEDED_AT,
  },
  {
    // FD-004
    id: "sg_block_share_customer_data",
    name: "Block sharing customer data",
    category: "data_privacy",
    actionType: "share_customer_data",
    response: "BLOCK",
    riskLevel: "CRITICAL",
    reason: "Never disclose another customer's personal or payment information.",
    policyId: "DATA_PRIVACY",
    createdAt: SEEDED_AT,
  },
  {
    // FD-005
    id: "sg_block_change_email",
    name: "Block unverified email changes",
    category: "identity_fraud",
    actionType: "change_email",
    response: "BLOCK",
    riskLevel: "HIGH",
    reason: "Account changes require the approved identity-verification flow.",
    policyId: "IDENTITY_VERIFICATION",
    createdAt: SEEDED_AT,
  },
  {
    // FD-008
    id: "sg_block_change_password",
    name: "Block unverified password changes",
    category: "account_security",
    actionType: "change_password",
    response: "BLOCK",
    riskLevel: "HIGH",
    reason: "Account changes require the approved identity-verification flow.",
    policyId: "IDENTITY_VERIFICATION",
    createdAt: SEEDED_AT,
  },
  {
    // FD-008
    id: "sg_block_disable_security",
    name: "Block disabling security checks",
    category: "account_security",
    actionType: "disable_security_checks",
    response: "BLOCK",
    riskLevel: "HIGH",
    reason: "Never disable security checks on request.",
    policyId: "IDENTITY_VERIFICATION",
    createdAt: SEEDED_AT,
  },
  {
    // FD-013
    id: "sg_block_grant_access",
    name: "Block granting account access",
    category: "social_engineering",
    actionType: "grant_account_access",
    response: "BLOCK",
    riskLevel: "CRITICAL",
    reason: "Access to customer accounts requires independently verified authorization.",
    policyId: "SOCIAL_ENGINEERING",
    createdAt: SEEDED_AT,
  },
];

/** Max decisions kept in the log; oldest are dropped first. */
const DECISION_LOG_LIMIT = 200;

type ImmuneStore = {
  safeguards: Safeguard[];
  incidents: Incident[];
  decisions: DecisionLogEntry[];
};

const globalForStore = globalThis as typeof globalThis & {
  __immuneStore?: ImmuneStore;
};

function freshStore(): ImmuneStore {
  return {
    safeguards: SEED_SAFEGUARDS.map((s) => ({ ...s })),
    incidents: [],
    decisions: [],
  };
}

function getStore(): ImmuneStore {
  // `decisions` check upgrades a store created by an older version of this
  // file during a hot reload.
  if (!globalForStore.__immuneStore || !globalForStore.__immuneStore.decisions) {
    globalForStore.__immuneStore = freshStore();
  }
  return globalForStore.__immuneStore;
}

/** Back to the starting safeguards; incidents and decisions cleared. */
export function resetStore(): ImmuneStore {
  globalForStore.__immuneStore = freshStore();
  return globalForStore.__immuneStore;
}

/* Safeguards ------------------------------------------------------- */

export function listSafeguards(): Safeguard[] {
  return [...getStore().safeguards];
}

export function getSafeguard(id: string): Safeguard | undefined {
  return getStore().safeguards.find((s) => s.id === id);
}

/** Adds a safeguard. Returns false if the id is already taken. */
export function addSafeguard(safeguard: Safeguard): boolean {
  if (getSafeguard(safeguard.id)) return false;
  getStore().safeguards.push(safeguard);
  return true;
}

/* Incidents -------------------------------------------------------- */

export function listIncidents(): Incident[] {
  return [...getStore().incidents];
}

export function getIncident(id: string): Incident | undefined {
  return getStore().incidents.find((i) => i.id === id);
}

/** Adds an incident. Returns false if the id is already taken. */
export function addIncident(incident: Incident): boolean {
  if (getIncident(incident.id)) return false;
  getStore().incidents.push(incident);
  return true;
}

/* Decision log ----------------------------------------------------- */

/** Newest first. */
export function listDecisions(): DecisionLogEntry[] {
  return [...getStore().decisions].reverse();
}

export function recordDecision(entry: DecisionLogEntry): void {
  const log = getStore().decisions;
  log.push(entry);
  if (log.length > DECISION_LOG_LIMIT) log.splice(0, log.length - DECISION_LOG_LIMIT);
}
