import type { Incident, Safeguard } from "@/shared/types";

/**
 * In-memory storage for the demo.
 *
 * - Data resets whenever the server restarts.
 * - Kept on globalThis so it survives hot reloads in `npm run dev`.
 * - Every function is the only way in/out, so swapping this for a real
 *   database later only means rewriting this file.
 */

/** Safeguards the demo starts with. */
const SEED_SAFEGUARDS: Safeguard[] = [
  {
    id: "sg_refund_review_500",
    name: "Large refund review",
    category: "financial_fraud",
    actionType: "refund",
    threshold: 500,
    response: "REVIEW",
    riskLevel: "HIGH",
    reason: "Refunds over $500 require human review.",
    createdAt: "2026-10-17T00:00:00.000Z",
  },
];

type ImmuneStore = {
  safeguards: Safeguard[];
  incidents: Incident[];
};

const globalForStore = globalThis as typeof globalThis & {
  __immuneStore?: ImmuneStore;
};

function getStore(): ImmuneStore {
  if (!globalForStore.__immuneStore) {
    globalForStore.__immuneStore = {
      safeguards: SEED_SAFEGUARDS.map((s) => ({ ...s })),
      incidents: [],
    };
  }
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
