export type Safeguard = {
  id: string;
  title: string;
  detail: string;
  source: string;
  active: boolean;
};

export type Decision = {
  status: "ALLOW" | "BLOCK" | "REVIEW";
  reason: string;
};

type ProposedAction = { amount: number; action: string };

// Deterministic demo behavior. Replace these functions with calls to Dhruv's API
// once its request and response shapes are agreed upon.
export function createDemoSafeguard(incident: ProposedAction): Safeguard {
  return {
    id: "learned-refund-threshold",
    title: "High-value refunds need human review",
    detail: `Refunds above $500 must be reviewed by a person before approval. Learned from a $${incident.amount.toLocaleString()} refund incident.`,
    source: "Learned from incident",
    active: true,
  };
}

export function evaluateDemoAction(action: ProposedAction, safeguards: Safeguard[]): Decision {
  const refundRule = safeguards.find((item) => item.active && item.id === "learned-refund-threshold");
  if (refundRule && action.action === "refund" && action.amount > 500) {
    return { status: "REVIEW", reason: `Amount is above $500. ${refundRule.title}.` };
  }
  return { status: "ALLOW", reason: "No active safeguard matched this action." };
}
