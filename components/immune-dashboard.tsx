"use client";

import { useState } from "react";
import {
  createDemoSafeguard,
  evaluateDemoAction,
  type Decision,
  type Safeguard,
} from "@/lib/immune-demo";

const initialSafeguards: Safeguard[] = [
  {
    id: "sg-001",
    title: "High-value refunds need human review",
    detail: "Refunds above $500 must be reviewed by a person before approval.",
    source: "Finance policy",
    active: true,
  },
];

export default function ImmuneDashboard() {
  const [safeguards, setSafeguards] = useState(initialSafeguards);
  const [incidentReported, setIncidentReported] = useState(false);
  const [learned, setLearned] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);

  function reportIncident() {
    setIncidentReported(true);
    setLearned(false);
    setDecision(null);
  }

  function learnSafeguard() {
    const suggestion = createDemoSafeguard({ amount: 4200, action: "refund" });
    setSafeguards((current) => [suggestion, ...current.filter((item) => item.id !== suggestion.id)]);
    setLearned(true);
  }

  function runAgentB() {
    setDecision(evaluateDemoAction({ amount: 1200, action: "refund" }, safeguards));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="IMMUNE home">
          <span className="brand-mark">I</span><span>IMMUNE</span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-switcher"><span className="workspace-dot" /> Acme Financial <span className="chevron">⌄</span></div>
        <nav className="nav-list" aria-label="Main navigation">
          <a className="nav-item active" href="#overview"><span>◫</span> Overview</a>
          <a className="nav-item" href="#activity"><span>◷</span> Activity <span className="nav-count">3</span></a>
          <a className="nav-item" href="#safeguards"><span>⬡</span> Safeguards <span className="nav-count">{safeguards.length}</span></a>
          <a className="nav-item" href="#agents"><span>◇</span> Agents <span className="status-dot" /></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="plan-card"><div className="plan-top"><span>DEMO MODE</span><span className="demo-pulse" /></div><p>Actions are simulated. No real refunds are sent.</p></div>
          <div className="user-row"><div className="avatar">NS</div><div><strong>Nithin S.</strong><small>Administrator</small></div><span className="more">•••</span></div>
        </div>
      </aside>

      <section className="main-content" id="overview">
        <header className="topbar"><div className="breadcrumb">Acme Financial <span>/</span> Overview</div><div className="topbar-right"><span className="live-indicator"><i /> Protection active</span><button className="icon-button" aria-label="Notifications">♧</button><div className="avatar small">NS</div></div></header>
        <div className="content-wrap">
          <div className="page-heading"><div><div className="eyebrow">MONDAY, OCTOBER 17, 2026</div><h1>Good morning, Nithin <span className="wave">✦</span></h1><p>Here’s what IMMUNE is protecting across your AI agents.</p></div><button className="button button-secondary" onClick={() => { setIncidentReported(false); setLearned(false); setDecision(null); }}>↻ <span>Reset demo</span></button></div>

          <div className="metric-grid">
            <article className="metric-card"><div className="metric-label">ACTIONS PROTECTED <span className="metric-icon teal">⌁</span></div><div className="metric-value">1,284</div><div className="metric-foot"><span className="positive">↗ 12.8%</span> <span>vs. last week</span></div><div className="sparkline"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></article>
            <article className="metric-card"><div className="metric-label">STOPPED OR FLAGGED <span className="metric-icon amber">⛨</span></div><div className="metric-value">23</div><div className="metric-foot"><span className="subtle">This week</span><span className="mini-bars"><i /><i /><i /><i /><i /><i /><i /><i /></span></div></article>
            <article className="metric-card"><div className="metric-label">ACTIVE SAFEGUARDS <span className="metric-icon violet">⬡</span></div><div className="metric-value" id="safeguards-count">{safeguards.length + 11}</div><div className="metric-foot"><span className="positive">+{learned ? 1 : 0} learned today</span><span>Across 4 agents</span></div></article>
          </div>

          <section className="demo-banner"><div className="demo-banner-icon">✳</div><div className="demo-banner-copy"><div className="banner-kicker">YOUR LIVE DEMO <span>·</span> 2 MIN</div><h2>One mistake. A safer system.</h2><p>Watch IMMUNE learn from one agent and protect another.</p></div><a className="banner-link" href="#learning-demo">Run the demo <span>→</span></a><div className="banner-orbit orbit-one"/><div className="banner-orbit orbit-two"/></section>

          <div className="section-heading" id="activity"><div><h2>Learning loop</h2><p>From one incident to protection across your agents</p></div><span className="step-caption">3 STEPS</span></div>
          <div className="learning-grid" id="learning-demo">
            <article className={`flow-card ${incidentReported ? "complete" : ""}`}>
              <div className="flow-step"><span className="step-number">01</span><span className="step-status">{incidentReported ? "REPORTED" : "INCIDENT"}</span></div>
              <div className="agent-line"><div className="agent-icon agent-orange">CS</div><div><strong>Customer Support Agent</strong><small>Refund approved · 9:41 AM</small></div><span className="risk-pill">POLICY MISS</span></div>
              <div className="event-box"><div className="event-label">ACTION TAKEN</div><p>Approved a <strong>$4,200 refund</strong> without human review.</p><div className="event-meta"><span>Customer: Jordan M.</span><span>Order #8042</span></div></div>
              <button className={`button ${incidentReported ? "button-done" : "button-dark"}`} onClick={reportIncident}>{incidentReported ? "✓ Incident reported" : "Report as incident"}</button>
            </article>
            <div className="flow-connector"><span>→</span></div>
            <article className={`flow-card ${learned ? "complete" : ""}`}>
              <div className="flow-step"><span className="step-number">02</span><span className="step-status">{learned ? "LEARNED" : "LEARN"}</span></div>
              <div className="learn-heading"><div className="learn-icon">✧</div><div><strong>Turn the miss into a safeguard</strong><small>{incidentReported ? "Incident ready for review" : "Report the incident to begin"}</small></div></div>
              <div className={`suggestion-box ${learned ? "learned-box" : ""}`}><div className="suggestion-label"><span>✧</span> SUGGESTED SAFEGUARD</div><p>Refunds above <strong>$500</strong> require human review before approval.</p><div className="suggestion-source">Based on: <span>one high-value refund incident</span></div></div>
              <button className={`button ${learned ? "button-done" : "button-teal"}`} onClick={learnSafeguard} disabled={!incidentReported}>{learned ? "✓ Safeguard added" : "Approve safeguard"}</button>
            </article>
            <div className="flow-connector"><span>→</span></div>
            <article className={`flow-card ${decision ? "complete" : ""}`} id="agents">
              <div className="flow-step"><span className="step-number">03</span><span className="step-status">{decision ? decision.status : "PROTECT"}</span></div>
              <div className="agent-line"><div className="agent-icon agent-blue">SA</div><div><strong>Sales Assistant Agent</strong><small>New refund request · just now</small></div></div>
              <div className="event-box agent-b-box"><div className="event-label">PROPOSED ACTION</div><p>Issue a <strong>$1,200 refund</strong> to a customer.</p><div className="event-meta"><span>Customer: Taylor R.</span><span>Order #9120</span></div></div>
              {decision && <div className={`decision-result ${decision.status.toLowerCase()}`}><span>{decision.status === "REVIEW" ? "◷" : "⛨"}</span><div><strong>{decision.status === "REVIEW" ? "Human review required" : "Action blocked"}</strong><small>{decision.reason}</small></div></div>}
              <button className={`button ${decision ? "button-done" : "button-outline"}`} onClick={runAgentB} disabled={!learned}>{decision ? "✓ Agent protected" : "Test Agent B"}</button>
            </article>
          </div>

          <div className="lower-grid">
            <section className="panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>What IMMUNE has seen today</p></div><a href="#activity">View all →</a></div><div className="activity-list"><div className="activity-row"><span className="activity-symbol blocked">⛨</span><div className="activity-text"><strong>Refund flagged for review</strong><small>Sales Assistant · 10:24 AM</small></div><span className="activity-status review">REVIEW</span></div><div className="activity-row"><span className="activity-symbol allowed">✓</span><div className="activity-text"><strong>Subscription renewed</strong><small>Billing Agent · 10:18 AM</small></div><span className="activity-status allowed-label">ALLOWED</span></div><div className="activity-row"><span className="activity-symbol blocked">⛨</span><div className="activity-text"><strong>Refund exceeded policy limit</strong><small>Customer Support · 9:41 AM</small></div><span className="activity-status blocked-label">FLAGGED</span></div></div></section>
            <section className="panel safeguards-panel"><div className="panel-heading"><div><h2>Active safeguards</h2><p>Rules protecting your agents</p></div><a href="#safeguards">See all →</a></div><div className="safeguard-list">{safeguards.slice(0, 2).map((item) => <div className="safeguard-row" key={item.id}><span className="safeguard-icon">⬡</span><div><strong>{item.title}</strong><small>{item.source} <span>·</span> Active</small></div><span className="toggle-on" aria-label="Active safeguard">●</span></div>)}<div className="safeguard-row"><span className="safeguard-icon violet-bg">⬡</span><div><strong>Customer data stays private</strong><small>Data protection <span>·</span> Active</small></div><span className="toggle-on" aria-label="Active safeguard">●</span></div></div></section>
          </div>
          <footer className="footer"><span>IMMUNE <span className="footer-dot">·</span> Self-learning safety for AI agents</span><span>All systems operational <i /></span></footer>
        </div>
      </section>
    </main>
  );
}
