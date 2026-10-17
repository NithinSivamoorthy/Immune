# IMMUNE backend API

Backend for the IMMUNE dashboard (Dhruv). All endpoints take and return JSON.
Errors return `{ "error": "<message>" }` with a 4xx status. Shared TypeScript
shapes live in `shared/types.ts` (import from `@/shared/types`).

Enforcement is deterministic: no LLM is called when an action is checked.
Storage is in memory, so it resets when the server restarts or on
`POST /api/immune/reset`.

## For the dashboard (shapes from `docs/IMMUNE_FRONTEND_INTEGRATION.md`)

These two endpoints match the contract proposed in the frontend integration
doc exactly, so `createDemoSafeguard` and `evaluateDemoAction` in
`lib/immune-demo.ts` can be swapped for them.

### Learn from a reviewed incident: `POST /api/incidents/learn`

```json
{
  "incident": {
    "agentId": "customer-support",
    "action": "refund",
    "amount": 4200,
    "currency": "USD",
    "summary": "Approved without required human review"
  }
}
```

Response (`201` when the rule is new, `200` when it was already learned):

```json
{
  "safeguard": {
    "id": "sg-learned-refund-review-500",
    "title": "High-value refunds need human review",
    "detail": "Refunds above $500 must be reviewed by a person before approval.",
    "action": "refund",
    "condition": { "field": "amount", "operator": "greater_than", "value": 500 },
    "outcome": "REVIEW",
    "active": true
  },
  "incidentId": "inc_..."
}
```

- Without a `safeguard` in the body, the backend builds the rule itself with
  fixed rules (`lib/immune/learn.ts`): refunds get "REVIEW above $500"; any
  other action type gets BLOCK.
- To store an LLM-generated rule instead, add `"safeguard": { "title", "detail",
  "action", "condition", "outcome" }` (same shape as the response) to the body.
- Learning the same rule twice returns the existing one, so the demo can be re-run.

### Check a proposed action: `POST /api/decisions/evaluate`

```json
{ "agentId": "sales-assistant", "action": "refund", "amount": 1200, "currency": "USD" }
```

```json
{
  "decision": "REVIEW",
  "reason": "Refunds above $500 must be reviewed by a person before approval.",
  "matchedSafeguardId": "sg-learned-refund-review-500"
}
```

`decision` is `ALLOW`, `BLOCK`, or `REVIEW`. `matchedSafeguardId` is absent on
`ALLOW`. Amounts are USD; `currency` is accepted but not converted.

### Demo helpers

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/safeguards?format=frontend` | All active safeguards in the dashboard shape above |
| GET | `/api/immune/decisions` | Last 200 decisions, newest first (for an activity feed) |
| POST | `/api/immune/reset` | Back to the starting safeguards; clears incidents and decisions |

## Demo flow

1. `POST /api/decisions/evaluate` with a $1,200 refund → `ALLOW` (nothing learned yet).
2. `POST /api/incidents/learn` with the $4,200 refund incident → the refund safeguard.
3. `POST /api/decisions/evaluate` with the $1,200 refund again → `REVIEW`.
4. `POST /api/immune/reset` to start over.

## Starting safeguards

Six rules are active from the start, matching Varad's Fire Drill policies
(`security/policies.ts`): policy-exception review, and blocks on sharing
customer data, email changes, password changes, disabling security checks, and
granting account access. Refunds over $500 and refund-destination changes are
deliberately not included: the demo learns them.

## Full backend API

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/api/immune/check` | `AgentAction` | `ImmuneDecision` |
| GET / POST | `/api/safeguards` | `CreateSafeguardRequest` (POST) | `Safeguard[]` / `Safeguard` |
| GET / POST | `/api/incidents` | `CreateIncidentRequest` (POST) | `Incident[]` / `Incident` |

Action type names everyone should use are in `shared/actionTypes.ts`.

## Testing (Windows CMD, server running with `npm run dev`)

```bat
curl -X POST http://localhost:3000/api/decisions/evaluate -H "Content-Type: application/json" -d @api-tests\evaluate-refund-1200.json
curl -X POST http://localhost:3000/api/incidents/learn -H "Content-Type: application/json" -d @api-tests\learn-refund-incident.json
curl -X POST http://localhost:3000/api/decisions/evaluate -H "Content-Type: application/json" -d @api-tests\evaluate-refund-1200.json
node api-tests\fire-drills.mjs
```
