"use client";

import { useState } from "react";
import type { AgentAction, ApiError, CreateIncidentRequest, ImmuneDecision, Incident, Safeguard } from "@/shared/types";


const agentAAction: AgentAction = {
  id: "act_agent_a_1",
  agentId: "agent-a",
  agentName: "Agent A",
  actionType: "change_refund_destination",
  reason: "Customer requested refund to a different bank account",
};

const decisionLabels: Record<ImmuneDecision["decision"], string> = {
  ALLOW: "Action may proceed",
  BLOCK: "IMMUNE stopped it",
  REVIEW: "Requires human approval",
};

export default function ImmuneDashboard({ onChange, onBusy }: { onChange: () => void; onBusy: (busy: boolean) => void }) {
  const [savedSafeguard, setSavedSafeguard] = useState<Safeguard | null>(null);
  const [learning, setLearning] = useState(false);
  const [learningError, setLearningError] = useState<string | null>(null);
  const [checkingAgentB, setCheckingAgentB] = useState(false);
  const [agentBError, setAgentBError] = useState<string | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [reportingIncident, setReportingIncident] = useState(false);
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const incidentReported = incident !== null;
  const learned = savedSafeguard !== null;
  const [decision, setDecision] = useState<ImmuneDecision | null>(null);
  const [agentADecision, setAgentADecision] = useState<ImmuneDecision | null>(null);
  const [checkingAgentA, setCheckingAgentA] = useState(false);
  const [agentAError, setAgentAError] = useState<string | null>(null);

  async function checkAgentA() {
    setCheckingAgentA(true); onBusy(true);
    setAgentADecision(null);
    setAgentAError(null);
    setIncident(null);
    setIncidentError(null);
    setSavedSafeguard(null);
    setLearningError(null);
    setDecision(null);
    setAgentBError(null);
    try {
      const response = await fetch("/api/immune/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentAAction),
      });
      const result: ImmuneDecision | ApiError = await response.json();
      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "IMMUNE check failed.");
      }
      setAgentADecision(result);
    } catch (error) {
      setAgentAError(error instanceof Error ? error.message : "Could not reach IMMUNE.");
    } finally {
      setCheckingAgentA(false); onBusy(false); onChange();
    }
  }

  async function reportIncident() {
    if (reportingIncident || incident || agentADecision?.decision !== "ALLOW") return;

    setReportingIncident(true); onBusy(true);
    setIncidentError(null);
    const body: CreateIncidentRequest = {
      description: "Agent A changed a refund destination to a different bank account without sufficient verification.",
      action: agentAAction,
    };
    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result: Incident | ApiError = await response.json().catch(() => {
        throw new Error("The server returned an unreadable response. Check /api/incidents before retrying.");
      });
      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : `Incident request failed (${response.status}).`);
      }
      setIncident(result);
      setSavedSafeguard(null); setLearningError(null); setAgentBError(null);
      setDecision(null);
    } catch (error) {
      setIncidentError(error instanceof Error ? error.message : "Could not reach IMMUNE. Check your connection and retry.");
    } finally {
      setReportingIncident(false); onBusy(false); onChange();
    }
  }

  async function learnSafeguard() {
    if (!incident || learning || savedSafeguard) return;
    setLearning(true); onBusy(true);
    setLearningError(null);
    try {
      const response = await fetch("/api/immune/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incident),
      });
      const result: Safeguard | ApiError = await response.json();
      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Could not learn and save the safeguard.");
      }
      setSavedSafeguard(result);
    } catch (error) {
      setLearningError(error instanceof Error ? error.message : "Learning failed. Please retry.");
    } finally {
      setLearning(false); onBusy(false); onChange();
    }
  }

  async function runAgentB() {
    if (!savedSafeguard || checkingAgentB) return;
    setCheckingAgentB(true); onBusy(true);
    setDecision(null);
    setAgentBError(null);
    const action: AgentAction = { ...agentAAction, id: "act_agent_b_1", agentId: "agent-b", agentName: "Agent B" };
    try {
      const response = await fetch("/api/immune/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const result: ImmuneDecision | ApiError = await response.json();
      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Agent B check failed.");
      }
      setDecision(result);
    } catch (error) {
      setAgentBError(error instanceof Error ? error.message : "Could not check Agent B. Retry.");
    } finally {
      setCheckingAgentB(false); onBusy(false); onChange();
    }
  }

  return (
    <section aria-label="Agent A learning loop">
      <p>Agent A = Customer Support Agent; Agent B = Refund Agent. Checks are real; no money is moved. A saved global rule can already protect Agent A on later runs.</p>
          <div className="section-heading" id="activity"><div><h2>Learning loop</h2><p>From one incident to protection across your agents</p></div><span className="step-caption">3 STEPS</span></div>
          <div className="learning-grid" id="learning-demo">
            <article className={`flow-card ${agentADecision ? "complete" : ""}`}>
              <div className="flow-step"><span className="step-number">01</span><span className="step-status">{checkingAgentA ? "CHECKING" : agentADecision?.decision ?? "CHECK ACTION"}</span></div>
              <div className="agent-line"><div className="agent-icon agent-orange">A</div><div><strong>Agent A</strong><small>Awaiting IMMUNE decision before proceeding</small></div></div>
              <div className="event-box"><div className="event-label">PROPOSED ACTION</div><p>Change the <strong>refund destination</strong> to a different bank account.</p><div className="event-meta"><span>{agentAAction.reason}</span></div></div>
              {agentADecision && (
                <div className={`decision-result ${agentADecision.decision === "BLOCK" ? "block" : agentADecision.decision.toLowerCase()}`} role="status">
                  <span>{agentADecision.decision === "ALLOW" ? "✓" : agentADecision.decision === "REVIEW" ? "◷" : "⛨"}</span>
                  <div>
                    <strong>{agentADecision.decision} — {decisionLabels[agentADecision.decision]}</strong>
                    <small>{agentADecision.reason}</small>
                    <small>Risk: {agentADecision.riskLevel} · Action: {agentADecision.actionId}</small>
                    {agentADecision.safeguardId && <small>Safeguard: {agentADecision.safeguardId}</small>}
                  </div>
                </div>
              )}
              {agentAError && <div className="decision-result block" role="alert"><div><strong>Action paused — check failed</strong><small>{agentAError} Retry the check before proceeding.</small></div></div>}
              <button className="button button-dark" onClick={checkAgentA} disabled={checkingAgentA || reportingIncident || learning || checkingAgentB}>{checkingAgentA ? "Checking with IMMUNE…" : "Check Agent A action"}</button>
              {agentADecision?.decision === "ALLOW" && <button className={`button ${incidentReported ? "button-done" : "button-outline"}`} onClick={reportIncident} disabled={reportingIncident || incidentReported}>{reportingIncident ? "Recording incident…" : incidentReported ? "✓ Incident recorded" : "Report as incident"}</button>}
            </article>
            <div className="flow-connector"><span>→</span></div>
            <article className={`flow-card ${incidentReported ? "complete" : ""}`}>
              <div className="flow-step"><span className="step-number">02</span><span className="step-status">{learning ? "LEARNING" : learned ? "LEARNED" : reportingIncident ? "RECORDING" : incidentReported ? "RECORDED" : "LEARN"}</span></div>
              <div className="learn-heading"><div className="learn-icon">✧</div><div><strong>{incidentReported ? "Incident recorded" : "Record the incident"}</strong><small>{incidentReported ? "Saved successfully to IMMUNE" : "Report the incident to begin"}</small></div></div>
              <div className={`suggestion-box ${incidentReported ? "learned-box" : ""}`} role="status" style={{ overflowWrap: "anywhere" }}>
                <div className="suggestion-label"><span>✧</span> {incidentReported ? "INCIDENT SAVED" : "AWAITING INCIDENT"}</div>
                {incident ? <>
                  <p>{incident.description}</p>
                  <div className="suggestion-source">Incident ID: <span>{incident.id}</span></div>
                  {incident.createdAt && <div className="suggestion-source">Created: <time dateTime={incident.createdAt}>{incident.createdAt}</time></div>}
                </> : <p>{reportingIncident ? "Saving Agent A’s checked action and incident description…" : "Check Agent A’s action, then report it as an incident."}</p>}
              </div>
              {incidentError && <div className="decision-result block" role="alert"><div><strong>Incident recording failed</strong><small>{incidentError} You can retry using Report as incident.</small></div></div>}
              {savedSafeguard && <div className="suggestion-box learned-box" role="status" style={{ overflowWrap: "anywhere" }}>
                <div className="suggestion-label">SAFEGUARD SAVED</div>
                <p><strong>{savedSafeguard.name}</strong></p>
                <p>Action: {savedSafeguard.actionType}<br />Response: {savedSafeguard.response}<br />Risk: {savedSafeguard.riskLevel}</p>
                <p>{savedSafeguard.reason}</p>
                <div className="suggestion-source">Learned from incident: {savedSafeguard.learnedFromIncident}</div>
              </div>}
              {learningError && <div className="decision-result block" role="alert"><div><strong>Learning failed</strong><small>{learningError}</small></div></div>}
              <button className={`button ${learned ? "button-done" : "button-teal"}`} onClick={learnSafeguard} disabled={!incident || learning || learned}>{learning ? "Learning and saving…" : learned ? "✓ Safeguard saved" : "Learn safeguard"}</button>
            </article>
            <div className="flow-connector"><span>→</span></div>
            <article className={`flow-card ${decision ? "complete" : ""}`} id="agents">
              <div className="flow-step"><span className="step-number">03</span><span className="step-status">{decision ? decision.decision : "PROTECT"}</span></div>
              <div className="agent-line"><div className="agent-icon agent-blue">SA</div><div><strong>Agent B</strong><small>New destination change · just now</small></div></div>
              <div className="event-box agent-b-box"><div className="event-label">PROPOSED ACTION</div><p>Change the <strong>refund destination</strong> to a different bank account.</p><div className="event-meta"><span>Customer: Taylor R.</span><span>Order #9120</span></div></div>
              {decision && <div className={`decision-result ${decision.decision === "BLOCK" ? "block" : decision.decision.toLowerCase()}`}><span>{decision.decision === "REVIEW" ? "◷" : "⛨"}</span><div><strong>{decision.decision} — {decisionLabels[decision.decision]}</strong><small>{decision.reason}</small><small>Risk: {decision.riskLevel} · Safeguard: {decision.safeguardId ?? "None"}</small></div></div>}
              {agentBError && <div className="decision-result block" role="alert"><div><strong>Agent B check failed</strong><small>{agentBError}</small></div></div>}
              <button className="button button-outline" onClick={runAgentB} disabled={!learned || checkingAgentB}>{checkingAgentB ? "Checking with IMMUNE…" : "Test Agent B"}</button>
            </article>
          </div>

    </section>
  );
}
