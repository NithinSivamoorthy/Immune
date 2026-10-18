"use client";
import { useEffect, useRef, useState } from "react";
import type { AgentAction, DashboardSnapshot, ImmuneDecision, Incident } from "@/shared/types";

export async function api<T>(path: string, body?: unknown, method = "POST"): Promise<T> {
  const response = await fetch(path, body === undefined ? { cache: "no-store" } : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status}).`);
  return data;
}
export type AgentState = "ACTIVE" | "CHECKING" | "PROTECTED" | "REVIEW" | "BLOCKED";
// Synthetic workspace traffic, never real transactions. Bounded, ordered and
// deliberately paused at a recorded incident so an operator controls learning.
const traffic: Array<{ slot: number; actionType: AgentAction["actionType"]; amount?: number; reason: string; label: string; incident?: boolean }> = [
  { slot: 0, actionType: "refund", amount: 84, reason: "Refund an eligible returned purchase to its original payment method.", label: "Refund $84" },
  { slot: 3, actionType: "refund", amount: 840, reason: "Refund a duplicate annual subscription charge.", label: "Refund $840" },
  { slot: 2, actionType: "read_policy", reason: "Retrieve the current account update policy before proceeding.", label: "Read account update policy" },
  { slot: 0, actionType: "change_refund_destination", reason: "Customer requested refund to a different bank account", label: "Change refund destination", incident: true },
  { slot: 1, actionType: "change_refund_destination", reason: "Customer requested refund to a different bank account", label: "Change refund destination" },
  { slot: 2, actionType: "modify_account", reason: "Change account owner without completed verification.", label: "Change account owner" },
  { slot: 0, actionType: "refund", amount: 126, reason: "Return payment for a cancelled order to the original payment method.", label: "Refund $126" },
  { slot: 1, actionType: "change_refund_destination", reason: "Customer requested refund to a different bank account", label: "Change refund destination" },
];
type Options = { businessId: string; data: DashboardSnapshot | null; busy: boolean; onSnapshot: (data: DashboardSnapshot) => void; onIncident: (incident: Incident) => void; onError: (message: string) => void };
export function useLiveMonitoring(options: Options) {
  const [running, setRunning] = useState(true);
  const [checking, setChecking] = useState(false);
  const [states, setStates] = useState<Record<string, AgentState>>({});
  const [details, setDetails] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const cursor = useRef<Record<string, number>>({});
  const inFlight = useRef(false);
  const current = useRef(options);
  useEffect(() => { current.current = options; });
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(async () => {
      const { businessId, data, busy, onSnapshot, onIncident, onError } = current.current;
      if (!data || busy || document.hidden || inFlight.current) return;
      const index = cursor.current[businessId] ?? 0;
      if (index >= traffic.length) { setRunning(false); setCompleted(true); return; }
      const item = traffic[index];
      const agent = data.agents[item.slot % data.agents.length];
      if (!agent?.immuneEnabled) { cursor.current[businessId] = index + 1; return; }
      inFlight.current = true; setChecking(true);
      setStates(previous => ({ ...previous, [agent.id]: "CHECKING" }));
      const action: AgentAction = { id: `live_${crypto.randomUUID()}`, agentId: agent.id, agentName: agent.name, actionType: item.actionType, amount: item.amount, reason: item.reason, context: { syntheticTraffic: true } };
      try {
        const decision = await api<ImmuneDecision>("/api/immune/check", action);
        // The decision always comes from the real deterministic backend.
        const state: AgentState = decision.decision === "ALLOW" ? "PROTECTED" : decision.decision === "BLOCK" ? "BLOCKED" : "REVIEW";
        if (alive.current) setStates(previous => ({ ...previous, [agent.id]: state }));
        if (item.incident && decision.decision === "ALLOW") {
          // Stable ID allows a retry after a transport error without duplicating an incident.
          const id = `inc_live_${businessId}_refund_destination`;
          let incident = data.incidents.find(i => i.id === id);
          if (!incident) {
            const existing = await api<Incident[]>("/api/incidents");
            incident = existing.find(i => i.id === id);
          }
          incident ??= await api<Incident>("/api/incidents", { id, action, description: `${agent.name} changed a refund destination to a different bank account without sufficient verification.` });
          if (alive.current) { setRunning(false); onIncident(incident); }
        }
        cursor.current[businessId] = index + 1;
        const next = await api<DashboardSnapshot>(`/api/dashboard?businessId=${businessId}`);
        if (alive.current) {
          const event = next.activity.find(e => e.agentId === agent.id && e.type.startsWith("ACTION_"));
          if (event) setDetails(previous => ({ ...previous, [event.id]: `${agent.name} — ${item.label}` }));
          onSnapshot(next);
          if (index === traffic.length - 1) { setRunning(false); setCompleted(true); }
        }
      } catch(error) {
        if (alive.current) { setRunning(false); setStates(previous => ({ ...previous, [agent.id]: "ACTIVE" })); onError(error instanceof Error ? error.message : "Monitoring interrupted. Retry by resuming monitoring."); }
      } finally { inFlight.current = false; if (alive.current) setChecking(false); }
    }, 6000);
    // Do not abort a mutation on pause: let its authoritative result arrive.
    return () => { clearInterval(timer); };
  }, [running]);
  function resume() {
    const businessId = current.current.businessId;
    if ((cursor.current[businessId] ?? 0) >= traffic.length) cursor.current[businessId] = 0;
    setCompleted(false); setRunning(true);
  }
  return { running, checking, states, details, completed, pause: () => setRunning(false), resume };
}
