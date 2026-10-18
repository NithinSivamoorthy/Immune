import type { Decision, FireDrillRun, ImmuneDecision, Incident, Safeguard } from "@/shared/types";
import { fireDrillScenarios } from "@/security/scenarios";
import { scenarioAction } from "@/security/actions";
import { activity, dashboardStore } from "./store";
const strictness: Record<Decision, number> = { ALLOW: 0, REVIEW: 1, BLOCK: 2 };
const risk = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
async function post<T>(origin: string, path: string, body: unknown): Promise<T> {
  const response = await fetch(new URL(path, origin), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(35000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? `${path} failed (${response.status}).`);
  return data as T;
}
export async function assess(businessId: string, origin: string): Promise<FireDrillRun> {
  const state = dashboardStore();
  if (state.runs.some(r => r.businessId === businessId && ["ASSESSING", "ASSESSED", "LEARNING"].includes(r.status))) throw new Error("Finish the existing Fire Drill first.");
  const agents = state.agents.filter(a => a.businessId === businessId && a.immuneEnabled);
  if (!agents.length) throw new Error("Enable IMMUNE on at least one agent before running Fire Drill.");
  const run: FireDrillRun = { id: `drill_${crypto.randomUUID()}`, businessId, startedAt: new Date().toISOString(), status: "ASSESSING", scenarioCount: fireDrillScenarios.length, passedCount: 0, failedCount: 0, safeguardsCreated: 0, learningLimit: state.settings[businessId].learningLimit, results: [] };
  state.runs.unshift(run); activity(businessId, "FIRE_DRILL_STARTED", `Assessing ${run.scenarioCount} scenarios; learning limit ${run.learningLimit}.`);
  try {
    for (const [index, scenario] of fireDrillScenarios.entries()) {
      const action = scenarioAction(scenario, agents[index % agents.length], run.id);
      const decision = await post<ImmuneDecision>(origin, "/api/immune/check", action);
      const passed = decision.decision === scenario.expectedOutcome;
      const weakness = strictness[decision.decision] < strictness[scenario.expectedOutcome];
      const finding = passed ? "PASS" : weakness ? "WEAKNESS FOUND" : "MORE RESTRICTIVE THAN EXPECTED";
      run.results.push({ id: `${run.id}_${scenario.id}`, runId: run.id, scenarioId: scenario.id, name: scenario.name, agentId: action.agentId, action, expectedOutcome: scenario.expectedOutcome, actualDecision: decision.decision, passed, weakness, riskLevel: scenario.risk, finding, selected: false, learningStatus: "NOT_SELECTED" });
      if (weakness) activity(businessId, "FIRE_DRILL_WEAKNESS_FOUND", `${scenario.name}: expected ${scenario.expectedOutcome}, received ${decision.decision}.`, action.agentId);
    }
    run.passedCount = run.results.filter(r => r.passed).length; run.failedCount = run.results.length - run.passedCount;
    // One representative per resulting action avoids generating duplicate rules.
    const selectedTypes = new Set<string>();
    for (const result of [...run.results].filter(r => r.weakness).sort((a,b) => risk[b.riskLevel] - risk[a.riskLevel])) {
      if (selectedTypes.size >= run.learningLimit) break;
      if (selectedTypes.has(result.action.actionType)) continue;
      selectedTypes.add(result.action.actionType); result.selected = true; result.learningStatus = "PENDING";
    }
    run.status = selectedTypes.size ? "ASSESSED" : "COMPLETE";
    if (run.status === "COMPLETE") run.completedAt = new Date().toISOString();
  } catch (error) { run.status = "ERROR"; run.completedAt = new Date().toISOString(); run.error = error instanceof Error ? error.message : "Assessment failed."; }
  return run;
}
export function expectedLearningResponse(incidentId: string) {
  return dashboardStore().runs.flatMap(r => r.results).find(r => r.incidentId === incidentId)?.expectedOutcome;
}
export async function learnFinding(run: FireDrillRun, resultId: string, origin: string) {
  const result = run.results.find(r => r.id === resultId);
  if (!result?.selected) throw new Error("This finding was not selected within the run's learning limit.");
  if (result.learningStatus === "COMPLETE") return run;
  if (run.results.some(r => r.learningStatus === "LEARNING")) throw new Error("Learning is already running. Wait for it to finish.");
  result.learningStatus = "LEARNING"; result.error = undefined; run.status = "LEARNING"; run.completedAt = undefined;
  try {
    if (!result.incidentId) {
      const incident = await post<Incident>(origin, "/api/incidents", { description: `Fire Drill ${result.scenarioId}: ${result.name}. Expected ${result.expectedOutcome}, received ${result.actualDecision}. ${result.action.reason}`, action: result.action });
      result.incidentId = incident.id;
    }
    const safeguard = await post<Safeguard>(origin, "/api/immune/learn", { id: result.incidentId, description: "Fire Drill finding", action: result.action });
    if (!result.safeguardId) { run.safeguardsCreated++; activity(run.businessId, "FIRE_DRILL_SAFEGUARD_CREATED", safeguard.name, result.agentId); }
    result.safeguardId = safeguard.id;
    const retest = await post<ImmuneDecision>(origin, "/api/immune/check", result.action);
    result.retestDecision = retest.decision; result.retestPassed = retest.decision === result.expectedOutcome;
    result.finding = result.retestPassed ? "PROTECTED" : "RETEST MISMATCH"; result.learningStatus = "COMPLETE";
    if (result.retestPassed) activity(run.businessId, "FIRE_DRILL_RETEST_PASSED", `${result.name}: ${retest.decision}`, result.agentId);
  } catch (error) { result.learningStatus = "ERROR"; result.error = error instanceof Error ? error.message : "Learning failed."; }
  const pending = run.results.some(r => r.learningStatus === "PENDING");
  run.status = pending ? "ASSESSED" : run.results.some(r => r.learningStatus === "ERROR") ? "ERROR" : "COMPLETE";
  if (!pending) run.completedAt = new Date().toISOString();
  return run;
}
