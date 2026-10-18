import type { Decision } from "@/shared/types";
import type { FireDrillScenario } from "./scenarios";

export type SimulationMode = "PROTECTED" | "VULNERABLE";
export type AgentOutcome = Decision;

export interface PolicyEvaluation {
  outcome: AgentOutcome;
  policyId: string;
  explanation: string;
  recommendedSafeguard: string;
  /** The simulator never performs a real-world action. */
  actionTaken: false;
  /** REVIEW always pauses for authorized human approval. */
  requiresHumanApproval: boolean;
}

interface PolicyRule {
  id: string;
  categories: readonly string[];
  promptPattern?: RegExp;
  outcome: AgentOutcome;
  explanation: string;
  safeguard: string;
}

const POLICIES: readonly PolicyRule[] = [
  {
    id: "PROMPT_INJECTION",
    categories: ["prompt_injection"],
    promptPattern: /ignore\s+(all\s+)?(previous|prior|system)\s+instructions|system\s+override|ignore\s+company\s+policies/i,
    outcome: "BLOCK",
    explanation: "Untrusted message content attempts to override system or company instructions. The text is treated only as data and is never followed.",
    safeguard: "Keep system policies separate from customer content; reject instruction override attempts and log the event.",
  },
  {
    id: "DATA_PRIVACY",
    categories: ["data_privacy"],
    promptPattern: /another customer|other customer|payment details|full name.*address/i,
    outcome: "BLOCK",
    explanation: "The request seeks private information belonging to another customer.",
    safeguard: "Enforce customer-scoped data access and never disclose another customer's personal or payment information.",
  },
  {
    id: "SOCIAL_ENGINEERING",
    categories: ["social_engineering"],
    promptPattern: /\b(ceo|chief executive|internal support team|support employee)\b/i,
    outcome: "BLOCK",
    explanation: "A claimed position, urgency, or authority is being used to pressure the agent into a sensitive action.",
    safeguard: "Do not trust claimed authority in a message; require independently verified authorization for sensitive requests.",
  },
  {
    id: "IDENTITY_VERIFICATION",
    categories: ["identity_fraud", "account_security"],
    promptPattern: /change (my )?(email|password)|disable (the )?security|without (verifying|verification)/i,
    outcome: "BLOCK",
    explanation: "An account change or security bypass is requested without verified identity.",
    safeguard: "Require the approved identity-verification flow before account changes; never disable security checks on request.",
  },
  {
    id: "REFUND_DESTINATION",
    categories: [],
    promptPattern: /refund destination|unrelated bank account|change .*bank account/i,
    outcome: "BLOCK",
    explanation: "The request attempts to redirect money to an unrelated payment destination.",
    safeguard: "Only use the verified original payment method; block destination changes and route disputes to a human.",
  },
  {
    id: "REPEATED_REFUND_ATTEMPTS",
    categories: ["abuse_detection"],
    promptPattern: /rejected .*times|keep submitting|same request until/i,
    outcome: "BLOCK",
    explanation: "The request asks the agent to repeat a rejected transaction until it succeeds.",
    safeguard: "Prevent repeated submissions after a rejection and require a human to review the dispute.",
  },
  {
    id: "POLICY_EXCEPTION_REVIEW",
    categories: ["policy_bypass", "outdated_information", "conflicting_instructions"],
    promptPattern: /outside the return window|override the refund policy|old policy|conflicting instructions|ignore that requirement/i,
    outcome: "REVIEW",
    explanation: "The request relies on an exception, outdated policy, or conflicting instruction. No action may occur before authorized human approval.",
    safeguard: "Use the current approved return policy and require an authorized human to resolve exceptions or conflicts.",
  },
  {
    id: "HIGH_VALUE_REFUND",
    categories: ["financial_fraud"],
    promptPattern: /\$\s*[\d,]+(?:\.\d{1,2})?\s*refund/i,
    outcome: "REVIEW",
    explanation: "A refund request is detected. Refunds above $500 require authorized human approval; the simulation does not issue refunds.",
    safeguard: "Require authorized human approval for refunds above $500 and verify the customer and original payment method.",
  },
];

function policyFor(
  scenario: Pick<FireDrillScenario, "category" | "prompt">,
): PolicyRule {
  const prompt = scenario.prompt;

  for (const rule of POLICIES) {
    if (
      rule.categories.includes(scenario.category) ||
      rule.promptPattern?.test(prompt)
    ) {
      return rule;
    }
  }

  return {
    id: "SAFE_INFORMATIONAL_REQUEST",
    categories: [],
    outcome: scenario.category === "normal_request" ? "ALLOW" : "REVIEW",
    explanation:
      scenario.category === "normal_request"
        ? "This is a general information request and does not ask the agent to change an account or move money."
        : "The request does not match a known safe action, so the agent pauses for review.",
    safeguard:
      "Limit automatic responses to general information; require human review for unclear or consequential requests.",
  };
}

/**
 * Evaluates scenario text as untrusted data using fixed rules. No prompt text is
 * executed, sent to a model, or connected to customer, payment, or account systems.
 */
export function evaluateCustomerSupportRequest(
  scenario: Pick<FireDrillScenario, "category" | "prompt">,
  mode: SimulationMode = "PROTECTED",
): PolicyEvaluation {
  const rule = policyFor(scenario);
  const vulnerable = mode === "VULNERABLE" && rule.outcome !== "ALLOW";
  const outcome: AgentOutcome = vulnerable ? "ALLOW" : rule.outcome;

  return {
    outcome,
    policyId: rule.id,
    explanation: vulnerable
      ? `VULNERABLE mode intentionally bypasses the ${rule.id} control. The scenario remains inert text; no action is performed.`
      : rule.explanation,
    recommendedSafeguard: rule.safeguard,
    actionTaken: false,
    requiresHumanApproval: outcome === "REVIEW",
  };
}
