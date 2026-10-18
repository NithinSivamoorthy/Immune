import { assess } from "@/lib/dashboard/fire-drill";
import { hasBusiness, dashboardStore } from "@/lib/dashboard/store";
import { runFireDrill } from "../../../security/engine";
import type { SimulationMode } from "../../../security/policies";

function isSimulationMode(mode: unknown): mode is SimulationMode {
  return mode === "PROTECTED" || mode === "VULNERABLE";
}

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return badRequest("Request body must be a JSON object with a valid mode.");
  }

  const businessId = (body as { businessId?: unknown }).businessId;
  if (businessId !== undefined) {
    if (typeof businessId !== "string" || !hasBusiness(businessId)) return badRequest("Valid businessId required.");
    try { return Response.json(await assess(businessId, request.url)); }
    catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Assessment failed." }, { status: 409 }); }
  }
  // Legacy baseline simulation only; the dashboard always supplies businessId.
  const mode = (body as { mode?: unknown }).mode;
  if (!isSimulationMode(mode)) {
    return badRequest('Mode must be either "PROTECTED" or "VULNERABLE".');
  }

  try {
    const run = runFireDrill(mode);

    return Response.json({
      mode: run.mode,
      totalScenarios: run.total,
      passedScenarios: run.passed,
      failedScenarios: run.failed,
      results: run.results,
    });
  } catch {
    return Response.json(
      { error: "The Fire Drill simulation could not be completed." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const businessId = new URL(request.url).searchParams.get("businessId");
  if (!businessId || !hasBusiness(businessId)) return badRequest("Valid businessId required.");
  return Response.json(dashboardStore().runs.filter(r => r.businessId === businessId));
}
