/**
 * Fire Drill engine tests using Node's built-in test runner.
 *
 * Run with Node 22.6+:
 *   node --experimental-strip-types --test security/engine.test.mjs
 *
 * The resolver hook maps the engine's extensionless TypeScript imports to .ts
 * files. No application or customer systems are loaded by these tests.
 */
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error?.code === "ERR_MODULE_NOT_FOUND" &&
        specifier.startsWith("./") &&
        !/\.[a-z0-9]+$/i.test(specifier)
      ) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});

const [{ runFireDrill }, { fireDrillScenarios }, { RISK_LEVELS }, { evaluateCustomerSupportRequest }] =
  await Promise.all([
    import("./engine.ts"),
    import("./scenarios.ts"),
    import("./riskLevels.ts"),
    import("./policies.ts"),
  ]);

test("processes all 15 Fire Drill scenarios", () => {
  const run = runFireDrill("PROTECTED");

  assert.equal(fireDrillScenarios.length, 15);
  assert.equal(run.total, 15);
  assert.equal(run.results.length, 15);
  assert.deepEqual(
    run.results.map((result) => result.scenarioId),
    fireDrillScenarios.map((scenario) => scenario.id),
  );
});

test("PROTECTED mode matches every scenario's expected decision", () => {
  const run = runFireDrill("PROTECTED");

  for (const result of run.results) {
    assert.equal(result.actualOutcome, result.expectedOutcome, result.scenarioId);
    assert.equal(result.status, "PASS", result.scenarioId);
  }
});

test("VULNERABLE mode produces at least one failed scenario", () => {
  const run = runFireDrill("VULNERABLE");

  assert.ok(run.results.some((result) => result.status === "FAIL"));
});

test("every result has a risk level defined by RISK_LEVELS", () => {
  for (const mode of ["PROTECTED", "VULNERABLE"]) {
    const run = runFireDrill(mode);

    for (const result of run.results) {
      assert.ok(
        Object.hasOwn(RISK_LEVELS, result.riskLevel),
        `${result.scenarioId} has unknown risk level ${result.riskLevel}`,
      );
    }
  }
});

test("PASS and FAIL totals match the scenario result statuses", () => {
  for (const mode of ["PROTECTED", "VULNERABLE"]) {
    const run = runFireDrill(mode);
    const passed = run.results.filter((result) => result.status === "PASS").length;
    const failed = run.results.filter((result) => result.status === "FAIL").length;

    assert.equal(run.total, passed + failed);
    assert.equal(run.passed, passed);
    assert.equal(run.failed, failed);
  }
});

test("REVIEW decisions require human approval and do not take action", () => {
  let reviewCount = 0;

  for (const scenario of fireDrillScenarios) {
    const evaluation = evaluateCustomerSupportRequest(
      { category: scenario.category, prompt: scenario.prompt },
      "PROTECTED",
    );

    if (evaluation.outcome === "REVIEW") {
      reviewCount += 1;
      assert.equal(evaluation.requiresHumanApproval, true, scenario.id);
      assert.equal(evaluation.actionTaken, false, scenario.id);
    }
  }

  assert.ok(reviewCount > 0, "at least one scenario should require REVIEW");
});

test("simulated requests never perform real-world actions", () => {
  for (const mode of ["PROTECTED", "VULNERABLE"]) {
    for (const scenario of fireDrillScenarios) {
      const evaluation = evaluateCustomerSupportRequest(
        { category: scenario.category, prompt: scenario.prompt },
        mode,
      );

      assert.equal(evaluation.actionTaken, false, scenario.id);
    }
  }
});

test("expectedOutcome affects scoring only, not the simulated decision", () => {
  const scenario = fireDrillScenarios[0];
  const originalExpectedOutcome = scenario.expectedOutcome;
  const before = runFireDrill("PROTECTED").results[0];

  try {
    scenario.expectedOutcome =
      originalExpectedOutcome === "ALLOW" ? "BLOCK" : "ALLOW";

    const after = runFireDrill("PROTECTED").results[0];

    assert.equal(after.actualOutcome, before.actualOutcome);
    assert.notEqual(after.status, before.status);
  } finally {
    scenario.expectedOutcome = originalExpectedOutcome;
  }
});
