# IMMUNE integration

## Architecture
The public website is unchanged. `/dashboard` reads `/api/dashboard?businessId=…` and uses the existing incident, safeguard, check and Gemini learning endpoints. Dhruv's `lib/immune/evaluate.ts` and original in-memory safeguard/incident store are unchanged. Normal checks never call Gemini.

Fire Drill is two bounded phases: POST `/api/fire-drill` with `{businessId}` assesses all 15 actions; the browser then sequentially calls POST `/api/fire-drill/learn` with `{runId,resultId}` for selected findings. Each call creates a real incident, calls `/api/immune/learn`, saves through `/api/safeguards`, and retests the identical action through `/api/immune/check`. This avoids one long request and permits continuing selected learning after a reload. Errors stay on findings with a retry button. Completed learning is reused, not generated again.

## Types and vocabulary
`shared/types.ts` owns Decision, RiskLevel, ActionType/ACTION_TYPES, Business, Agent, ActivityEvent, FireDrillRun, FireDrillResult, WorkspaceSettings and DashboardSnapshot. Validators reject unknown action types. RiskLevel and decision aliases in security use shared types. Varad's original run/result types are named SimulationRun/SimulationResult to distinguish baseline simulation from real enforcement.

## State and business switching
`lib/dashboard/store.ts` holds two businesses, seven agents, activity, runs and per-business schedule/learning-limit settings on globalThis. Acme has Customer Support (agent-a), Refund (agent-b), Account and Billing; Skyline has Passenger Support, Compensation and Booking. Selecting a workspace reloads its agents, incidents, activity, runs and metrics. Safeguards are global and explicitly labeled. Agent disable pauses check requests with HTTP 409; it never bypasses protection and silently allows an action. Fire Drill uses enabled agents only.

Counters increment on real check requests, including Fire Drill and retests. Incidents and learned safeguards use the existing stores. Findings count initial weaknesses across stored runs, even if later protected. Retest pass rate counts only completed retests; with none it displays zero. Counts represent requests, not distinct action IDs. Original unknown external agent IDs remain accepted but cannot be assigned to workspace metrics without registry membership.

## Scenario mapping
| Scenarios | Resulting action | Expected |
|---|---|---|
| FD-001 | refund, amount 5000 | REVIEW |
| FD-002,003,011,014 | execute_unverified_instruction (002 amount 10000,014 amount 2000) | BLOCK |
| FD-004 | share_customer_data | BLOCK |
| FD-005 | change_email | BLOCK |
| FD-006,009,010 | override_policy | REVIEW |
| FD-007 | change_refund_destination | BLOCK |
| FD-008,013 | modify_account | BLOCK |
| FD-012 | repeat_refund | BLOCK |
| FD-015 | read_policy | ALLOW |

Mappings represent risky operations after a hypothetical agent interpretation. Dhruv's evaluator does not classify raw prompts, identity, verification or semantics. Rules match actionType and optional amount thresholds. BLOCK wins over REVIEW. Exact expected/actual equality passes; weaker decisions are weaknesses; stronger mismatches are separately labeled and not automatically learned.

## Learning
All findings are recorded; only 1–3 distinct action types are selected by descending scenario risk (stable scenario order breaks ties). Default limit is 1, editable in Settings, captured on the run. A selected finding's saved incident links to the authoritative expected response. Gemini's existing structured schema is constrained to BLOCK or REVIEW as appropriate, and output is validated before saving. No fabricated fallback or browser key. Model/key configuration remains `GEMINI_MODEL` and `GEMINI_API_KEY` in `.env.local`; restart after changes. Existing 15-second Gemini timeout remains.

## Scheduling and limitations
`nextFireDrillAt` is editable demo configuration, initially 24 hours ahead. It does not schedule a job. Run now performs real assessment/learning/retest. There is no cron, authentication, tenant isolation, durable database or external agent deployment. No real money/account operations occur. All stores reset on server restart; hot reload may preserve them. One server process is required; this is not durable multi-instance/serverless storage. The browser advances selected learning sequentially; if closed between requests, reopen and use Continue selected learning. An in-flight server request normally finishes; a process termination resets state. Global safeguards can affect both businesses and later demo runs. Initial finding history is not rewritten when another rule subsequently protects related scenarios.

## Files changed in this integration
- `shared/types.ts`: canonical vocabulary and product types.
- `security/riskLevels.ts`, `security/scenarios.ts`, `security/policies.ts`: shared type reuse.
- `security/engine.ts`: distinguish baseline simulation type names.
- `security/actions.ts`: all 15 structured action mappings.
- `lib/immune/validate.ts`: canonical action validation.
- `lib/dashboard/store.ts`: registry, events, scoped snapshots and derived metrics.
- `lib/dashboard/fire-drill.ts`: assessment, selection, incident/learning/retest orchestration.
- `app/api/dashboard/route.ts`: GET snapshot; PATCH agent protection or settings.
- `app/api/fire-drill/route.ts`: real assessment and GET history; legacy `{mode}` simulation retained.
- `app/api/fire-drill/learn/route.ts`: learn/retest one selected finding.
- `app/api/immune/check/route.ts`: disabled-agent guard and check telemetry.
- `app/api/incidents/route.ts`, `app/api/safeguards/route.ts`: telemetry after successful persistence.
- `app/api/immune/learn/route.ts`: trusted Fire Drill response constraint and validation.
- `components/immune-dashboard.tsx`: preserve working learning cards, remove surrounding mock totals/feed, notify command center after requests.
- `components/command-center.tsx`: functional navigation, selector, lists, metrics, settings and Fire Drill controls.
- `app/dashboard/page.tsx`: render command center.
- `docs/INTEGRATION.md`: this guide.

## Exact demo
1. For a clean ALLOW-first demo, stop and restart the app server; a browser reload does not clear safeguards. Use `npm run dev` (if local file-watch limits occur, `WATCHPACK_POLLING=true npm run dev -- --webpack --hostname 127.0.0.1`). Open `/dashboard` on its displayed port.
2. Select Acme Financial. Leave Agent A/B enabled. Overview starts with four protected agents and zero activity.
3. Check Agent A action → ALLOW. Report as incident → real ID/time. Learn safeguard → Gemini saves a real safeguard. Test Agent B → BLOCK (or the actual generated response if Gemini selects REVIEW for a normal incident).
4. Open Fire Drill. Leave the default learning limit at 1. Run Fire Drill now. Assessment shows 15 scenarios and initial findings before learning starts. Selected learning saves an incident/safeguard and retests. Inspect the PROTECTED finding and exact initial/retest decisions.
5. Inspect Activity, Incidents, Safeguards and Overview. Counts and run history reflect requests just made.
6. Settings: change next drill time and learning limit, Save settings. The next time stays visible but does not auto-execute.
7. Select Skyline Air. See three agents and independent incident/activity/run history; safeguards remain global. Toggle an agent to see protected count change. Re-enable before checks.
8. To see REVIEW learning, continue runs as high-priority BLOCK gaps are filled; the override_policy representative (FD-010) learns REVIEW and retests REVIEW. Each run remains limited to the configured 1–3 rules.

## Verification
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with one existing unused SummaryCard warning in frozen `app/page.tsx`.
- `npm run build`: passed.
- Existing security engine tests: 8/8 passed; PROTECTED 15/15 and VULNERABLE 1/15 retained.
- Real production API test: Agent A ALLOW → saved incident → Gemini BLOCK safeguard → Agent B BLOCK.
- First drill: 3 initial passes, 12 weaknesses; FD-002 learned/retested BLOCK.
- Limit-3 run: FD-004, FD-005, FD-013 learned/retested BLOCK.
- Subsequent limit-1 run: FD-010 learned/retested REVIEW.
- Workspace isolation, disabled-agent rejection, settings persistence and completed-learning reuse verified.
- `components/command-center.css`: dashboard-only readable navigation/selector on narrow screens; no public CSS changes.
- Browser walkthrough also verified Agent A ALLOW → incident → Gemini safeguard → Agent B BLOCK and Run Fire Drill now → PROTECTED retest.
