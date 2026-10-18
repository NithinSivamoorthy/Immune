import type { RiskLevel } from "./riskLevels";
import {
  evaluateCustomerSupportRequest,
  type AgentOutcome,
  type SimulationMode,
} from "./policies";
import {
  fireDrillScenarios,
  type ExpectedOutcome,
} from "./scenarios";

export type FireDrillStatus = "PASS" | "FAIL";

export interface SimulationResult {
  scenarioId: string;
  name: string;
  category: string;
  riskLevel: RiskLevel;
  expectedOutcome: ExpectedOutcome;
  actualOutcome: AgentOutcome;
  status: FireDrillStatus;
  explanation: string;
  recommendedSafeguard: string;
}

export interface SimulationRun {
  mode: SimulationMode;
  total: number;
  passed: number;
  failed: number;
  results: SimulationResult[];
}

/**
 * Runs the fixed scenario set against the deterministic simulated agent.
 * expectedOutcome is used only after evaluation, to score the result.
 */
export function runFireDrill(
  mode: SimulationMode = "PROTECTED",
): SimulationRun {
  const results: SimulationResult[] = fireDrillScenarios.map((scenario) => {
    // The evaluator receives only the untrusted prompt and its category.
    // It never receives expectedOutcome and cannot perform real actions.
    const evaluation = evaluateCustomerSupportRequest(
      { category: scenario.category, prompt: scenario.prompt },
      mode,
    );
    const passed = evaluation.outcome === scenario.expectedOutcome;

    return {
      scenarioId: scenario.id,
      name: scenario.name,
      category: scenario.category,
      riskLevel: scenario.risk,
      expectedOutcome: scenario.expectedOutcome,
      actualOutcome: evaluation.outcome,
      status: passed ? "PASS" : "FAIL",
      explanation: evaluation.explanation,
      recommendedSafeguard: evaluation.recommendedSafeguard,
    };
  });

  const passed = results.filter((result) => result.status === "PASS").length;

  return {
    mode,
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}
