# IMMUNE learning demo

## Configure the server

Create `.env.local` in the repo root, beside `package.json`:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Use a Gemini API key from Google AI Studio in a Free tier project. Keep paid billing disabled for the free demo; requests are subject to your project’s free quota. The model setting is optional; the default is `gemini-2.5-flash`. Do not prefix either variable with `NEXT_PUBLIC_`. `.env.local` is already ignored by Git. Restart `npm run dev` after changing it.

The route uses built-in fetch and Gemini structured JSON output. No SDK installation is required. The key is read only in `app/api/immune/learn/route.ts`; it is never returned to the browser.

## Full local flow

1. Start a fresh `npm run dev` process and open http://localhost:3000.
2. Click **Check Agent A action**. With the seed rules, expect ALLOW.
3. Click **Report as incident**. Step 2 displays the saved incident ID and timestamp.
4. Click **Learn safeguard**. The server sends the saved incident to Gemini, validates one generated rule, POSTs it to `/api/safeguards`, and returns the saved Safeguard.
5. Step 2 displays its name, actionType, response, risk, reason, and real incident reference. Wording and risk are generated dynamically; BLOCK or REVIEW is valid.
6. Open `/api/safeguards` in a second tab. Find the rule whose `learnedFromIncident` matches step 2. Step 3 becomes enabled only after successful saving.
7. Click **Test Agent B**. It proposes the same action type under another agent ID and calls only `/api/immune/check`. Its decision should be BLOCK or REVIEW, referencing the stored safeguard. No LLM call occurs during this check.
8. Repeat **Test Agent B** and inspect Network: there should be only check requests, no learn requests. The Gemini call and internal safeguard POST happen server-side, so they do not appear as separate browser requests.

## Error and retry checks

- Without `GEMINI_API_KEY`, learning reports the missing configuration and step 3 remains disabled. Set the key, restart, and repeat the flow.
- Invalid credentials, quota errors, refusals, invalid generated JSON, timeouts, and save failures show a learning error instead of enabling step 3. There is no simulated fallback.
- Request blocking for `/api/immune/learn` in browser developer tools exercises the client error state. Remove the block and retry.
- Reposting the same saved incident to `/api/immune/learn` returns its existing safeguard without another LLM call. Concurrent requests in this single server process share one generation. Failed attempts can be retried and may make a new LLM call.

**Reset demo** clears browser state only. The backend uses in-memory storage: restart the server to clear incidents and learned safeguards before replaying the initial ALLOW scenario. This is a single-process local demo, not durable or distributed storage.

## Contract and scope

`POST /api/immune/learn` accepts the saved `Incident` directly as its JSON body and returns a `Safeguard`. The server looks up the authoritative incident by ID. The LLM chooses the name, category, response, risk, and reason. The schema binds actionType and learnedFromIncident to that saved incident; this demo generates a rule covering that action type across agents, without a monetary threshold. Dhruv's deterministic evaluator is unchanged.

Reference: [Gemini Structured Outputs](https://ai.google.dev/gemini-api/docs/structured-output).
