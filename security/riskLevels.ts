
/**
 * IMMUNE Security Risk Levels
 *
 * Defines how serious an AI agent mistake is.
 */

import type { RiskLevel } from "@/shared/types";
export type { RiskLevel } from "@/shared/types";

export const RISK_LEVELS: Record<RiskLevel, string> = {
  LOW: "Minor mistake with little consequence.",

  MEDIUM: "Customer inconvenience or limited impact.",

  HIGH: "Meaningful financial, account, or privacy impact.",

  CRITICAL:
    "Large financial loss, serious privacy exposure, or major policy violation.",
};
