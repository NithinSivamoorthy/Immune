# IMMUNE frontend integration

## Demo behavior in this branch

`components/immune-dashboard.tsx` drives the three-step demo. `lib/immune-demo.ts` contains deterministic local behavior so the demo works without credentials or a running backend. It is intentionally not presented as an LLM result: the UI labels the rule as a suggested safeguard and the sidebar says the workspace is in demo mode.

## Suggested backend contract

The frontend needs two operations. Endpoint names are proposals until Dhruv confirms the API he is building.

### Learn from a reviewed incident

`POST /api/incidents/learn`

Request:

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

Response:

```json
{
  "safeguard": {
    "id": "sg-refund-review-001",
    "title": "High-value refunds need human review",
    "detail": "Refunds above $500 must be reviewed by a person before approval.",
    "action": "refund",
    "condition": { "field": "amount", "operator": "greater_than", "value": 500 },
    "outcome": "REVIEW",
    "active": true
  }
}
```

### Check a proposed agent action

`POST /api/decisions/evaluate`

Request:

```json
{
  "agentId": "sales-assistant",
  "action": "refund",
  "amount": 1200,
  "currency": "USD"
}
```

Response:

```json
{
  "decision": "REVIEW",
  "reason": "Refunds above $500 must be reviewed by a person before approval.",
  "matchedSafeguardId": "sg-refund-review-001"
}
```

Allowed decisions are `ALLOW`, `BLOCK`, and `REVIEW`. The backend should enforce safeguards even if the browser UI is bypassed. The frontend can display the returned decision and reason; it should not be the authority that permits a real-world action.

## Integration checklist

1. Confirm the endpoint paths and JSON fields with Dhruv before wiring the adapter.
2. Add the backend base URL to a local environment file (never commit secrets).
3. Replace `createDemoSafeguard` with the learn request and store the returned safeguard.
4. Replace `evaluateDemoAction` with the evaluate request and render its response.
5. Keep the local demo fallback available so the presentation works when the backend is offline.

