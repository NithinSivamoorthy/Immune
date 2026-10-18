import { dashboardStore, findAgent, hasBusiness, snapshot } from "@/lib/dashboard/store";
import { errorResponse, readJson } from "@/lib/immune/http";
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("businessId") ?? "acme";
  return hasBusiness(id) ? Response.json(snapshot(id)) : errorResponse(404, "Workspace not found.");
}
export async function PATCH(request: Request) {
  const parsed = await readJson(request); if (!parsed.ok) return parsed.response;
  const body = parsed.body as Record<string, unknown> | null;
  if (!body || typeof body.businessId !== "string" || !hasBusiness(body.businessId)) return errorResponse(400, "Valid businessId required.");
  const state = dashboardStore();
  if (state.runs.some(r => r.businessId === body.businessId && ["ASSESSING", "ASSESSED", "LEARNING"].includes(r.status))) return errorResponse(409, "Finish the active Fire Drill before changing settings or protection.");
  if (body.agentId !== undefined) {
    const agent = typeof body.agentId === "string" ? findAgent(body.agentId) : undefined;
    if (!agent || agent.businessId !== body.businessId || typeof body.immuneEnabled !== "boolean") return errorResponse(400, "Valid workspace agent and immuneEnabled required.");
    agent.immuneEnabled = body.immuneEnabled;
  } else {
    if (typeof body.nextFireDrillAt !== "string" || !Number.isFinite(Date.parse(body.nextFireDrillAt)) || !Number.isInteger(body.learningLimit) || Number(body.learningLimit) < 1 || Number(body.learningLimit) > 3) return errorResponse(400, "Choose a valid date and a learning limit from 1 to 3.");
    state.settings[body.businessId] = { nextFireDrillAt: new Date(body.nextFireDrillAt).toISOString(), learningLimit: Number(body.learningLimit) };
  }
  return Response.json(snapshot(body.businessId));
}
