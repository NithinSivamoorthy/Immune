// Public storytelling only. Real checks and learning remain in /dashboard.
export const scenes = [
  { status: "ACTION", label: "Change refund destination", tone: "neutral" },
  { status: "ALLOW", label: "No safeguard matched", tone: "green" },
  { status: "INCIDENT", label: "An unverified destination change", tone: "red" },
  { status: "LEARNING", label: "Analyze the recorded failure", tone: "amber" },
  { status: "SAFEGUARD", label: "Block unverified destination changes", tone: "green" },
  { status: "SHARED", label: "One rule. Every relevant agent.", tone: "green" },
  { status: "CHECKING", label: "Agent B proposes the same action", tone: "neutral" },
  { status: "BLOCKED", label: "The safeguard stops Agent B", tone: "green" },
] as const;

export const industries = [
  { name: "Financial services", action: "Refund $14,200", decision: "REVIEW", reason: "Large financial actions require human approval." },
  { name: "Insurance", action: "Approve an unverified claim", decision: "BLOCK", reason: "Verification comes before payment." },
  { name: "Airlines", action: "Change passenger identity", decision: "BLOCK", reason: "Passenger identity changes require verified authorization." },
  { name: "Telecom", action: "Change account owner", decision: "BLOCK", reason: "Protect the subscriber's identity." },
  { name: "Utilities", action: "Disconnect essential service", decision: "REVIEW", reason: "A human reviews the consequence." },
  { name: "Healthcare administration", action: "Send records outside the organization", decision: "BLOCK", reason: "Keep sensitive records inside the boundary." },
] as const;

export const capabilities = [
  { name: "Runtime action gating", tag: "CORE", description: "Check each action before execution." },
  { name: "Incident memory", tag: "CORE", description: "Keep the failure and its context together." },
  { name: "Learned safeguards", tag: "CORE", description: "Turn one incident into a reusable rule." },
  { name: "Cross-agent protection", tag: "CORE", description: "Apply that rule wherever the same risk appears." },
  { name: "Human review", tag: "REVIEW DECISION", description: "Flag actions for approval. Full approval workflows are planned." },
  { name: "Fire Drills", tag: "PLANNED", description: "Discover failures with synthetic scenarios." },
  { name: "Auditability", tag: "DEMO RECORDS", description: "Trace decisions back to incidents and safeguards." },
  { name: "Policy ingestion", tag: "PLANNED", description: "Turn company policy into reviewed safeguards." },
];

// Edit demo prices here. No checkout or billing is connected.
export const plans = [
  { name: "Starter", monthly: 499, annualTotal: 5389, description: "Up to 10 agents", features: ["All IMMUNE features", "The full safety platform", "Scale by protected agents"], cta: "Open dashboard", featured: false },
  { name: "Growth", monthly: 1999, annualTotal: 21589, description: "Up to 50 agents", features: ["All IMMUNE features", "The full safety platform", "Scale by protected agents"], cta: "Open dashboard", featured: true },
  { name: "Enterprise", monthly: null, annualTotal: null, description: "50+ agents", features: ["All IMMUNE features", "Custom scale, deployment & support", "Custom commercial terms"], cta: "Contact enterprise", featured: false },
];
