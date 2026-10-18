import type { ActivityEvent, Agent, AgentAction, Business, DashboardSnapshot, FireDrillRun, ImmuneDecision, WorkspaceSettings } from "@/shared/types";
import { listIncidents, listSafeguards } from "@/lib/immune/store";
const businesses: Business[] = [{ id: "acme", name: "Acme Financial", industry: "Financial services" }, { id: "skyline", name: "Skyline Air", industry: "Travel" }];
const seeds = [ ["agent-a", "acme", "Customer Support Agent"], ["agent-b", "acme", "Refund Agent"], ["account", "acme", "Account Agent"], ["billing", "acme", "Billing Agent"], ["passenger", "skyline", "Passenger Support Agent"], ["compensation", "skyline", "Compensation Agent"], ["booking", "skyline", "Booking Agent"] ];
type State = { agents: Agent[]; activity: ActivityEvent[]; runs: FireDrillRun[]; settings: Record<string, WorkspaceSettings> };
const root = globalThis as typeof globalThis & { immuneDashboard?: State };
export function dashboardStore(): State {
  return root.immuneDashboard ??= { agents: seeds.map(([id, businessId, name]) => ({ id, businessId, name, role: name.replace(" Agent", ""), status: "ACTIVE", immuneEnabled: true, actionsChecked: 0, blockedActions: 0, reviewActions: 0, incidents: 0 })), activity: [], runs: [], settings: Object.fromEntries(businesses.map(b => [b.id, { nextFireDrillAt: new Date(Date.now() + 86400000).toISOString(), learningLimit: 1 }])) };
}
export function findAgent(id: string) { return dashboardStore().agents.find(a => a.id === id); }
export function hasBusiness(id: string) { return businesses.some(b => b.id === id); }
export function activity(businessId: string, type: ActivityEvent["type"], message: string, agentId?: string) {
  dashboardStore().activity.unshift({ id: crypto.randomUUID(), businessId, type, message, agentId, createdAt: new Date().toISOString() });
}
export function recordCheck(action: AgentAction, decision: ImmuneDecision) {
  const agent = findAgent(action.agentId); if (!agent) return;
  agent.actionsChecked++; agent.blockedActions += Number(decision.decision === "BLOCK"); agent.reviewActions += Number(decision.decision === "REVIEW"); agent.lastActionAt = new Date().toISOString();
  activity(agent.businessId, decision.decision === "ALLOW" ? "ACTION_ALLOWED" : decision.decision === "BLOCK" ? "ACTION_BLOCKED" : "ACTION_REVIEW", `${action.agentName}: ${action.actionType} → ${decision.decision}`, agent.id);
}
export function snapshot(businessId: string): DashboardSnapshot {
  const state = dashboardStore(); const agents = state.agents.filter(a => a.businessId === businessId);
  const incidents = listIncidents().filter(i => agents.some(a => a.id === i.action.agentId));
  const safeguards = listSafeguards(); const runs = state.runs.filter(r => r.businessId === businessId);
  const results = runs.flatMap(r => r.results); const retests = results.filter(r => r.retestPassed !== undefined);
  return { businesses, agents, incidents, safeguards, runs, activity: state.activity.filter(e => e.businessId === businessId), settings: state.settings[businessId], metrics: {
    "Total agents": agents.length, "Protected agents": agents.filter(a => a.immuneEnabled).length,
    "Actions checked": agents.reduce((n,a) => n+a.actionsChecked,0), "Blocked actions": agents.reduce((n,a) => n+a.blockedActions,0), "Reviewed actions": agents.reduce((n,a) => n+a.reviewActions,0),
    "Incidents found": incidents.length, "Learned safeguards (global)": safeguards.filter(s => s.learnedFromIncident).length,
    "Fire Drill findings": results.filter(r => r.weakness).length, "Retest pass rate (%)": retests.length ? Math.round(retests.filter(r => r.retestPassed).length / retests.length * 100) : 0,
  } };
}
