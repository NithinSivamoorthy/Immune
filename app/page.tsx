"use client";

import { useState } from "react";

type SimulationMode = "PROTECTED" | "VULNERABLE";
type AgentOutcome = "ALLOW" | "BLOCK" | "REVIEW";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface FireDrillResult {
  scenarioId: string;
  name: string;
  category: string;
  riskLevel: RiskLevel;
  expectedOutcome: AgentOutcome;
  actualOutcome: AgentOutcome;
  status: "PASS" | "FAIL";
  explanation: string;
  recommendedSafeguard: string;
}

interface FireDrillResponse {
  mode: SimulationMode;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  results: FireDrillResult[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFireDrillResult(value: unknown): value is FireDrillResult {
  if (!isRecord(value)) return false;

  return (
    typeof value.scenarioId === "string" &&
    typeof value.name === "string" &&
    typeof value.category === "string" &&
    ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(String(value.riskLevel)) &&
    ["ALLOW", "BLOCK", "REVIEW"].includes(String(value.expectedOutcome)) &&
    ["ALLOW", "BLOCK", "REVIEW"].includes(String(value.actualOutcome)) &&
    (value.status === "PASS" || value.status === "FAIL") &&
    typeof value.explanation === "string" &&
    typeof value.recommendedSafeguard === "string"
  );
}

function isFireDrillResponse(value: unknown): value is FireDrillResponse {
  if (!isRecord(value)) return false;

  const countsAreValid =
    Number.isInteger(value.totalScenarios) &&
    Number.isInteger(value.passedScenarios) &&
    Number.isInteger(value.failedScenarios) &&
    Number(value.totalScenarios) >= 0 &&
    Number(value.passedScenarios) >= 0 &&
    Number(value.failedScenarios) >= 0 &&
    Number(value.passedScenarios) + Number(value.failedScenarios) ===
      Number(value.totalScenarios);

  return (
    (value.mode === "PROTECTED" || value.mode === "VULNERABLE") &&
    countsAreValid &&
    Array.isArray(value.results) &&
    value.results.length === value.totalScenarios &&
    value.results.every(isFireDrillResult)
  );
}

const riskStyles: Record<RiskLevel, string> = {
  LOW: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  MEDIUM: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  HIGH: "border-orange-400/20 bg-orange-400/10 text-orange-300",
  CRITICAL: "border-rose-400/20 bg-rose-400/10 text-rose-300",
};

const outcomeStyles: Record<AgentOutcome, string> = {
  ALLOW: "border-sky-400/20 bg-sky-400/[0.07] text-sky-300",
  BLOCK: "border-rose-400/20 bg-rose-400/[0.07] text-rose-300",
  REVIEW: "border-amber-400/20 bg-amber-400/[0.07] text-amber-300",
};

export default function Home() {
  const [mode, setMode] = useState<SimulationMode>("PROTECTED");
  const [run, setRun] = useState<FireDrillResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);

  const securityScore =
    run && run.totalScenarios > 0
      ? Math.round((run.passedScenarios / run.totalScenarios) * 100)
      : null;

  function selectMode(nextMode: SimulationMode) {
    setMode(nextMode);
    setRun(null);
    setError(null);
    setLastRunAt(null);
  }

  async function runFireDrill() {
    setIsRunning(true);
    setError(null);
    setRun(null);
    setLastRunAt(null);

    try {
      const response = await fetch("/api/fire-drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : "The Fire Drill could not be started. Please try again.";
        throw new Error(message);
      }

      if (!isFireDrillResponse(payload)) {
        throw new Error("The Fire Drill returned an unexpected response.");
      }

      setRun(payload);
      setLastRunAt(new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while running the simulation.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080c11] text-slate-100">
      <header className="border-b border-white/[0.07] bg-[#0b1017]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-300">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <path d="M12 2.75 19.25 5.5v5.8c0 4.48-2.9 8.42-7.25 9.95-4.35-1.53-7.25-5.47-7.25-9.95V5.5L12 2.75Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="m8.8 11.9 2.1 2.1 4.45-4.65" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.22em] text-white">IMMUNE</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">AI safety operations</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            Simulation environment
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
              <span className="h-px w-7 bg-emerald-400/70" />
              Security validation / customer support agent
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Fire Drill console
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Test how an AI agent responds to realistic security scenarios.
              Every run is simulated; no customer accounts, refunds, or payments are touched.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
            <span className="font-mono text-emerald-300">15</span>
            scenarios ready
          </div>
        </div>

        <section aria-labelledby="agent-mode-title" className="mb-6 rounded-2xl border border-white/[0.08] bg-[#0d131b] p-4 sm:p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 id="agent-mode-title" className="text-sm font-semibold text-white">Choose agent mode</h2>
              <p className="mt-1 text-xs text-slate-500">Select how the simulated agent should handle this drill.</p>
            </div>
            <span className="w-fit rounded-full border border-sky-400/15 bg-sky-400/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-sky-300">
              Simulated only
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              aria-pressed={mode === "PROTECTED"}
              disabled={isRunning}
              onClick={() => selectMode("PROTECTED")}
              className={`group rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                mode === "PROTECTED"
                  ? "border-emerald-400/35 bg-emerald-400/[0.07] ring-1 ring-emerald-400/10"
                  : "border-white/[0.08] bg-[#090e14] hover:border-white/20"
              }`}
            >
              <span className="flex items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-semibold text-white">Protected agent</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">Company security controls are enforced.</span>
                </span>
                <span className={`rounded-md border px-2 py-1 text-[10px] font-bold tracking-wide ${
                  mode === "PROTECTED"
                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 text-slate-500"
                }`}>POLICY ON</span>
              </span>
            </button>

            <button
              type="button"
              aria-pressed={mode === "VULNERABLE"}
              disabled={isRunning}
              onClick={() => selectMode("VULNERABLE")}
              className={`group rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                mode === "VULNERABLE"
                  ? "border-amber-400/35 bg-amber-400/[0.06] ring-1 ring-amber-400/10"
                  : "border-white/[0.08] bg-[#090e14] hover:border-white/20"
              }`}
            >
              <span className="flex items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-semibold text-white">Vulnerable agent</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">Demonstrates failures by simulating bypassed controls.</span>
                </span>
                <span className={`rounded-md border px-2 py-1 text-[10px] font-bold tracking-wide ${
                  mode === "VULNERABLE"
                    ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
                    : "border-white/10 text-slate-500"
                }`}>DEMO MODE</span>
              </span>
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              The drill uses fixed test scenarios and never connects to live customer or payment systems.
            </p>
            <button
              type="button"
              onClick={runFireDrill}
              disabled={isRunning}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 text-sm font-semibold text-[#07110d] shadow-[0_8px_30px_rgba(16,185,129,0.12)] transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
            >
              {isRunning ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07110d]/25 border-t-[#07110d]" />
                  Running simulation…
                </>
              ) : (
                <>
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M6.4 4.65a.8.8 0 0 1 1.2-.69l8.1 4.68a.8.8 0 0 1 0 1.38l-8.1 4.68a.8.8 0 0 1-1.2-.69V4.65Z" />
                  </svg>
                  Run Fire Drill
                </>
              )}
            </button>
          </div>
        </section>

        {error && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">
            <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-rose-300/40 text-xs">!</span>
            <div>
              <p className="font-semibold">Fire Drill couldn’t run</p>
              <p className="mt-1 text-xs leading-5 text-rose-200/75">{error}</p>
            </div>
          </div>
        )}

        <section aria-label="Fire Drill summary" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Total scenarios" value={run ? run.totalScenarios : "—"} detail={run ? `Mode: ${run.mode.toLowerCase()}` : "Waiting for first run"} color="text-sky-300" />
          <SummaryCard label="Passed tests" value={run ? run.passedScenarios : "—"} detail={run ? "Controls matched expected behavior" : "Results appear after the drill"} color="text-emerald-300" />
          <SummaryCard label="Failed tests" value={run ? run.failedScenarios : "—"} detail={run ? "Review safeguards below" : "No test has been run yet"} color={run?.failedScenarios ? "text-rose-300" : "text-slate-300"} />
          <div className="rounded-xl border border-white/[0.08] bg-[#0d131b] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-400">Security score</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{securityScore === null ? "—" : `${securityScore}%`}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-violet-400/15 bg-violet-400/[0.06] text-sm font-semibold text-violet-300">%</div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">{run ? "Based on passed scenarios in this run" : "Calculated from actual run results"}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-violet-400 transition-all duration-500" style={{ width: `${securityScore ?? 0}%` }} />
            </div>
          </div>
        </section>

        <section aria-labelledby="scenario-results-title" className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d131b]">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 id="scenario-results-title" className="text-sm font-semibold text-white">Scenario results</h2>
              <p className="mt-1 text-xs text-slate-500">
                {run
                  ? `Showing all ${run.results.length} returned scenarios · ${run.mode.toLowerCase()} simulation`
                  : "Run a drill to see the agent’s responses and safeguards."}
              </p>
            </div>
            {lastRunAt && <span className="text-[11px] text-slate-500">Last run at {lastRunAt}</span>}
          </div>

          {run ? (
            <div className="divide-y divide-white/[0.06]">
              {run.results.map((result) => (
                <article key={result.scenarioId} className="px-4 py-4 transition hover:bg-white/[0.015] sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        result.status === "PASS"
                          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
                          : "border-rose-400/20 bg-rose-400/[0.08] text-rose-300"
                      }`} aria-label={result.status}>
                        {result.status === "PASS" ? "✓" : "!"}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-mono text-[10px] text-slate-500">{result.scenarioId}</span>
                          <h3 className="text-sm font-medium text-slate-100">{result.name}</h3>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-400">{result.explanation}</p>
                        <p className="mt-2 text-[10px] text-slate-500">
                          Expected <span className="font-medium text-slate-300">{result.expectedOutcome}</span>
                          <span className="mx-1.5 text-slate-700">·</span>
                          Agent decision <span className="font-medium text-slate-300">{result.actualOutcome}</span>
                          <span className="mx-1.5 text-slate-700">·</span>
                          <span className="uppercase tracking-[0.1em]">{result.category.replace(/_/g, " ")}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 pl-10 sm:pl-0">
                      <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold tracking-wide ${riskStyles[result.riskLevel]}`}>
                        {result.riskLevel}
                      </span>
                      <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold tracking-wide ${outcomeStyles[result.actualOutcome]}`}>
                        {result.actualOutcome}
                      </span>
                      <span className={`rounded-md border px-2 py-1 text-[10px] font-bold tracking-wide ${
                        result.status === "PASS"
                          ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
                          : "border-rose-400/20 bg-rose-400/[0.07] text-rose-300"
                      }`}>
                        {result.status}
                      </span>
                    </div>
                  </div>

                  {result.status === "FAIL" && (
                    <div className="ml-10 mt-3 rounded-lg border border-amber-400/15 bg-amber-400/[0.045] px-3 py-2.5 sm:ml-10">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">Recommended safeguard</p>
                      <p className="mt-1 text-xs leading-5 text-slate-300">{result.recommendedSafeguard}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 py-12 text-center">
              {isRunning ? (
                <>
                  <span className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/20 border-t-emerald-300" />
                  <p className="text-sm font-medium text-slate-200">Testing simulated agent behavior</p>
                  <p className="mt-1 text-xs text-slate-500">Processing the scenario set…</p>
                </>
              ) : (
                <>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-500">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                      <path d="M12 3.5 19 6v5.6c0 4.2-2.7 7.9-7 9.4-4.3-1.5-7-5.2-7-9.4V6l7-2.5Z" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M12 8v4m0 3h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-200">No drill results yet</p>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                    Choose an agent mode and run the Fire Drill. All results shown here come from the API simulation.
                  </p>
                </>
              )}
            </div>
          )}
        </section>

        <footer className="mt-5 flex flex-col gap-2 text-[11px] leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>IMMUNE Fire Drill · Controlled cybersecurity simulation</p>
          <p>No live agent, customer record, refund, payment, or account change is connected.</p>
        </footer>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: number | string;
  detail: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0d131b] p-4 sm:p-5">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${color}`}>{value}</p>
      <p className="mt-2 text-[11px] text-slate-500">{detail}</p>
    </div>
  );
}
