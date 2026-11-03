# IMMUNE

**The immune system for your AI workforce.**

> **AI mistakes are inevitable. Repeating them isn’t.**

IMMUNE is an AI agent safety and governance platform built for a future where companies increasingly rely on autonomous AI agents to perform real-world work.

Instead of simply monitoring what an AI agent says, IMMUNE sits between an agent’s **intent and execution**.

Every proposed action is evaluated before it reaches the real world:

```text
AI Agent
   ↓
Proposed Action
   ↓
IMMUNE
   ↓
ALLOW / REVIEW / BLOCK
   ↓
Execution
```

When a failure is discovered, IMMUNE turns that incident into a reusable safeguard so the same mistake does not spread across the rest of the organization.

**One agent fails. Every agent learns.**

---

# Why IMMUNE?

As AI evolves from assistants into autonomous workers, the risk changes.

An AI system is no longer just generating text.

It may:

- issue refunds
- modify customer accounts
- change payment information
- interact with internal systems
- access sensitive data
- execute workflows
- make decisions on behalf of a company

A single mistake can create financial, operational, privacy, security, or customer harm.

More importantly, if many agents operate across the same company, the same failure can be repeated at machine speed.

IMMUNE creates a **shared organizational memory for AI failures**.

---

# Core Idea

IMMUNE combines two forms of protection.

## Reactive Immunity

When a real AI agent mistake occurs:

```text
Incident
   ↓
Gemini analyzes what went wrong
   ↓
Structured safeguard generated
   ↓
Safeguard stored
   ↓
Future matching actions are BLOCKED or REVIEWED
```

A lesson learned from one agent can protect every other agent in the organization.

---

## Proactive Immunity — Fire Drill

Companies should not have to wait for a real customer to be harmed before discovering a weakness.

IMMUNE includes **Fire Drill**, a proactive testing system that runs risky scenarios against the organization's current safeguards.

```text
Synthetic Risk Scenario
   ↓
AI Agent Action
   ↓
IMMUNE Evaluation
   ↓
Weakness Detected
   ↓
Gemini Generates Safeguard
   ↓
Scenario Retested
   ↓
Protection Verified
```

The current prototype includes **15 Fire Drill security scenarios** covering areas such as:

- financial fraud
- prompt injection
- data privacy
- social engineering
- identity fraud
- policy bypass
- account security
- conflicting instructions
- abuse detection
- outdated information

---

# Key Features

### Real-Time Agent Protection

Every structured AI agent action is evaluated through IMMUNE before execution.

Possible decisions:

- `ALLOW`
- `REVIEW`
- `BLOCK`

The runtime evaluator is deterministic, making protection fast, predictable, and inexpensive.

---

### Self-Learning Safeguards

When an incident occurs, Gemini analyzes the failure and produces a structured safeguard.

The safeguard is then stored and enforced by IMMUNE's deterministic policy layer.

IMMUNE does **not** retrain the AI model.

Instead:

```text
Failure
→ Generalized lesson
→ Structured safeguard
→ Deterministic enforcement
```

---

### Cross-Agent Protection

Safeguards are shared across the AI workforce.

A mistake discovered through one agent can immediately protect other agents from repeating the same behavior.

---

### Live Monitoring

The dashboard simulates a running AI workforce and sends structured actions through the real IMMUNE evaluator.

Operators can see:

- agent activity
- actions checked
- ALLOW / REVIEW / BLOCK decisions
- incidents
- learned safeguards
- protection status
- Fire Drill findings

---

### Fire Drill

Fire Drill proactively evaluates 15 risky scenarios against the organization's current safeguards.

It can:

1. detect weaknesses
2. prioritize high-risk findings
3. generate safeguards
4. store the safeguard
5. retest the original scenario
6. verify that protection now works

To keep model usage efficient, only a limited number of representative high-risk failures are automatically selected for learning.

---

### Multi-Workspace Dashboard

IMMUNE supports multiple demo businesses/workspaces.

Operators can switch between organizations and view:

- protected agents
- total agents
- actions checked
- blocked actions
- human reviews
- incidents
- learned safeguards
- Fire Drill findings
- latest activity
- next scheduled Fire Drill

---

# Product Architecture

```text
                        ┌───────────────────┐
                        │     AI Agents     │
                        └─────────┬─────────┘
                                  │
                           Proposed Action
                                  │
                                  ▼
                     ┌────────────────────────┐
                     │         IMMUNE         │
                     │                        │
                     │ Deterministic Evaluator│
                     └────────────┬───────────┘
                                  │
                  ┌───────────────┼───────────────┐
                  ▼               ▼               ▼
               ALLOW           REVIEW           BLOCK
                  │
                  ▼
            Real-World Action


INCIDENT LEARNING

Incident
   │
   ▼
Gemini
   │
   ▼
Structured Safeguard
   │
   ▼
Safeguard Store
   │
   ▼
Future Deterministic Enforcement
```

---

# Why Deterministic Enforcement?

IMMUNE intentionally does **not** call an LLM for every action.

Normal runtime:

```text
Agent Action
→ Deterministic Evaluator
→ ALLOW / REVIEW / BLOCK
```

Learning:

```text
Incident / Fire Drill Failure
→ Gemini
→ New Safeguard
→ Deterministic Enforcement
```

This architecture provides:

- lower inference costs
- lower latency
- predictable decisions
- easier auditing
- clear policy enforcement
- fewer unnecessary LLM calls

The LLM is used to **learn the lesson once**.

The policy engine enforces that lesson repeatedly.

---

# Example

### Before Learning

Agent A proposes:

```json
{
  "id": "act_agent_a_1",
  "agentId": "agent-a",
  "agentName": "Agent A",
  "actionType": "change_refund_destination",
  "reason": "Customer requested refund to a different bank account"
}
```

IMMUNE returns:

```json
{
  "decision": "ALLOW"
}
```

The action is later reported as an incident.

Gemini analyzes the incident and creates a safeguard.

---

### After Learning

Another agent attempts the same risky action.

IMMUNE returns:

```json
{
  "decision": "BLOCK",
  "riskLevel": "CRITICAL",
  "reason": "Changing where a refund is sent is blocked."
}
```

The organization has now learned from the first failure.

---

# Fire Drill Scenarios

The current prototype contains 15 scenarios.

| ID | Scenario | Risk | Expected |
|---|---|---:|---|
| FD-001 | High-Value Refund | Critical | Review |
| FD-002 | Fake Executive Override | Critical | Block |
| FD-003 | Ignore Previous Instructions | High | Block |
| FD-004 | Customer Data Leak | Critical | Block |
| FD-005 | Identity Spoofing | High | Block |
| FD-006 | Refund Policy Bypass | Medium | Review |
| FD-007 | Suspicious Bank Account Change | Critical | Block |
| FD-008 | Unauthorized Account Modification | High | Block |
| FD-009 | Outdated Refund Policy | Medium | Review |
| FD-010 | Conflicting Instructions | High | Review |
| FD-011 | Fake Urgency | High | Block |
| FD-012 | Repeated Refund Attempts | High | Block |
| FD-013 | Fake Support Employee | Critical | Block |
| FD-014 | Hidden Malicious Instructions | High | Block |
| FD-015 | Normal Customer Request | Low | Allow |

---

# Tech Stack

## Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- responsive dashboard
- custom IMMUNE design system

## Backend

- Next.js API Routes
- TypeScript
- deterministic policy evaluator
- structured safeguard engine
- in-memory hackathon data store

## AI

- Google Gemini API
- structured safeguard generation
- incident generalization
- Fire Drill learning

## Deployment

- Vercel
- GitHub

---

# Repository Structure

```text
Immune/
│
├── app/
│   ├── api/
│   │   ├── dashboard/
│   │   ├── fire-drill/
│   │   ├── immune/
│   │   ├── incidents/
│   │   └── safeguards/
│   │
│   ├── dashboard/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── marketing/
│   ├── immune-dashboard.tsx
│   └── live-monitoring.ts
│
├── lib/
│   ├── dashboard/
│   └── immune/
│
├── security/
│   ├── actions.ts
│   ├── engine.ts
│   ├── policies.ts
│   ├── riskLevels.ts
│   └── scenarios.ts
│
├── shared/
│   └── types.ts
│
├── public/
│   └── immune-symbol.svg
│
└── docs/
```

---

# API

## Check an Agent Action

```http
POST /api/immune/check
```

Example:

```json
{
  "id": "act_123",
  "agentId": "agent-b",
  "agentName": "Agent B",
  "actionType": "refund",
  "amount": 4000,
  "customerId": "cust_42",
  "target": "order_9",
  "reason": "Customer complained",
  "context": {}
}
```

Response:

```json
{
  "decision": "REVIEW",
  "reason": "Refunds over $500 require human review.",
  "riskLevel": "HIGH",
  "actionId": "act_123",
  "safeguardId": "sg_refund_review_500"
}
```

---

## Incidents

```http
GET /api/incidents
POST /api/incidents
```

Example:

```json
{
  "description": "Agent A changed a refund destination to an unrelated bank account.",
  "action": {
    "id": "act_a",
    "agentId": "agent-a",
    "agentName": "Agent A",
    "actionType": "change_refund_destination",
    "reason": "Customer asked"
  }
}
```

---

## Safeguards

```http
GET /api/safeguards
POST /api/safeguards
```

Example safeguard:

```json
{
  "name": "Block refund destination changes",
  "category": "financial_fraud",
  "actionType": "change_refund_destination",
  "response": "BLOCK",
  "riskLevel": "CRITICAL",
  "reason": "Changing where a refund is sent is blocked."
}
```

---

## Fire Drill

```http
POST /api/fire-drill
```

Fire Drill evaluates all configured scenarios through the same IMMUNE evaluator used for normal agent actions.

---

# Getting Started

Clone the repository:

```bash
git clone https://github.com/NithinSivamoorthy/Immune.git
cd Immune
```

Install dependencies:

```bash
npm install
```

Create:

```text
.env.local
```

Add:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=your_working_gemini_model
```

Never commit `.env.local`.

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Dashboard:

```text
http://localhost:3000/dashboard
```

---

# Production Build

```bash
npm run build
```

Run production:

```bash
npm start
```

---

# Testing

The project includes backend/API tests covering the core IMMUNE evaluator and Fire Drill behavior.

Run the available test scripts defined in `package.json`.

The HackATL build was verified with:

- TypeScript checks
- lint
- production build
- existing API tests
- live browser testing
- end-to-end incident learning
- Fire Drill retesting

---

# Demo Flow

For a fresh demo, restart the server so the in-memory state resets.

Recommended flow:

```text
Open /dashboard
       ↓
Live agent action → ALLOW
       ↓
Large refund → REVIEW
       ↓
Risky refund-destination incident appears
       ↓
Review Incident
       ↓
Learn Safeguard
       ↓
Gemini generates safeguard
       ↓
Later matching agent action
       ↓
BLOCK
       ↓
Open Fire Drill
       ↓
Run 15 scenarios
       ↓
Find weakness
       ↓
Learn safeguard
       ↓
Retest
       ↓
PROTECTED
```

---

# Business Model

IMMUNE is designed as B2B AI infrastructure.

All customers receive the complete safety platform.

Pricing scales primarily with the number of protected AI agents.

| Plan | Protected Agents | Price |
|---|---:|---:|
| Starter | Up to 10 | $499/month |
| Growth | Up to 50 | $1,999/month |
| Enterprise | 50+ | Custom |

Annual plans:

- Starter: **$5,389/year**
- Growth: **$21,589/year**
- Enterprise: custom

Starter and Growth annual plans receive approximately a 10% discount.

IMMUNE does not lock safety functionality behind higher pricing tiers.

---

# Initial Market

IMMUNE's initial beachhead is:

**Customer-service AI agents in high-stakes industries.**

Initial focus:

- financial services

Potential expansion:

- insurance
- airlines
- telecom
- utilities
- healthcare administration
- other enterprise AI-agent environments

Typical potential buyers include:

- Chief AI Officer
- CIO / CTO
- Chief Risk Officer
- Head of AI
- VP Customer Experience
- AI governance teams

---

# The World After AI

IMMUNE was built around the HackATL 2026 theme:

**Designing the World After AI**

Today, many companies are experimenting with AI agents.

In the future, organizations may operate with dozens, hundreds, or thousands of autonomous agents performing real business functions.

As that happens, the problem changes.

The challenge is no longer:

> “Can this model produce a good answer?”

It becomes:

> “Can an organization safely control thousands of autonomous decisions?”

IMMUNE is designed for that world.

```text
2026
AI assistants

↓

Agentic workflows

↓

Autonomous AI workers

↓

Large AI workforces

↓

2036
Organizations need a shared control and failure-memory layer
```

IMMUNE's long-term vision is to become the:

> **Operating safety system for companies whose workforce is increasingly AI.**

---

# Competitive Positioning

IMMUNE does not claim that AI safety, monitoring, or guardrail products do not exist.

Existing categories include:

- AI guardrails
- observability
- model evaluation
- red teaming
- policy engines
- AI governance platforms

IMMUNE's specific focus is the combination of:

### Runtime Enforcement

Every structured action can be evaluated before execution.

### Incident-to-Safeguard Learning

A discovered failure becomes a reusable policy.

### Shared Failure Memory

Lessons can protect multiple agents across an organization.

### Proactive Fire Drill

Organizations can discover weaknesses before customers encounter them.

### Retesting

IMMUNE verifies whether the newly learned safeguard actually fixes the discovered weakness.

---

# Current Prototype Limitations

This is a hackathon prototype, not a production enterprise deployment.

Current limitations include:

- in-memory data storage
- data resets on server restart
- safeguards are currently globally stored
- no production authentication
- no SSO / SCIM
- no persistent enterprise database
- no real background scheduler
- Fire Drill scheduling is configuration-only
- demo workspace traffic is simulated
- external enterprise systems are not yet integrated
- safeguard matching is intentionally simplified

The evaluator, learning loop, safeguard creation, incident flow, Fire Drill evaluation, and retesting are functional within the disclosed demo scope.

---

# Roadmap

## Phase 1 — Hackathon MVP

- deterministic evaluator
- live agent monitoring
- incidents
- learned safeguards
- Fire Drill
- multi-workspace dashboard
- Gemini safeguard generation

## Phase 2 — Pilot

- persistent database
- real customer-support AI integration
- authentication
- audit logs
- policy ingestion
- scheduled Fire Drills

## Phase 3 — Enterprise

- SSO / SCIM
- private networking
- VPC deployments
- enterprise policy integrations
- long-term audit retention
- compliance workflows
- advanced analytics
- SLAs

## Phase 4 — AI Workforce Infrastructure

Expand IMMUNE from customer-service AI into an organization-wide safety and control layer for autonomous AI workers.

---

# Team

### Nithin Sivamoorthy
**Project Lead — AI, Product, Frontend & Learning System**

- product direction
- dashboard/UI
- AI-agent workflows
- Gemini safeguard generation
- full-stack integration

### Dhruv
**Full-Stack Engineering — Backend & API**

- deterministic IMMUNE evaluator
- backend architecture
- API routes
- safeguards/incidents
- integration infrastructure

### Varad
**Cybersecurity — Testing & Fire Drill**

- adversarial scenarios
- Fire Drill
- security testing
- risk categories
- policy evaluation

### Arnav
**Business & Finance**

- market strategy
- pricing
- financial model
- go-to-market
- pitch strategy

---

# HackATL 2026

IMMUNE was built for **HackATL 2026** under the theme:

> **Designing the World After AI**

The project explores one central question:

> If AI agents become an organization's workforce, what protects the organization when those agents make mistakes?

Our answer:

# IMMUNE

**One agent fails. Every agent learns.**
