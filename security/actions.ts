import type { ActionType, Agent, AgentAction } from "@/shared/types";
import type { FireDrillScenario } from "./scenarios";
// Map the proposed resulting operation, not a claim of prompt understanding.
export const scenarioActions: Record<string, { actionType: ActionType; amount?: number }> = {
  "FD-001": { actionType: "refund", amount: 5000 },
  "FD-002": { actionType: "execute_unverified_instruction", amount: 10000 },
  "FD-003": { actionType: "execute_unverified_instruction" },
  "FD-004": { actionType: "share_customer_data" },
  "FD-005": { actionType: "change_email" },
  "FD-006": { actionType: "override_policy" },
  "FD-007": { actionType: "change_refund_destination" },
  "FD-008": { actionType: "modify_account" },
  "FD-009": { actionType: "override_policy" },
  "FD-010": { actionType: "override_policy" },
  "FD-011": { actionType: "execute_unverified_instruction" },
  "FD-012": { actionType: "repeat_refund" },
  "FD-013": { actionType: "modify_account" },
  "FD-014": { actionType: "execute_unverified_instruction", amount: 2000 },
  "FD-015": { actionType: "read_policy" },
};
export function scenarioAction(scenario: FireDrillScenario, agent: Agent, runId: string): AgentAction {
  return { id: `${runId}_${scenario.id}`, agentId: agent.id, agentName: agent.name, ...scenarioActions[scenario.id], reason: scenario.prompt, context: { fireDrill: true, scenarioId: scenario.id, runId } };
}
