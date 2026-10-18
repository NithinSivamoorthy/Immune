import { findAgent, activity } from "@/lib/dashboard/store";
import { connection } from "next/server";
import type { Incident } from "@/shared/types";
import { errorResponse, readJson } from "@/lib/immune/http";
import { addIncident, listIncidents } from "@/lib/immune/store";
import { validateCreateIncident } from "@/lib/immune/validate";

/**
 * GET /api/incidents
 * Returns: Incident[] (200).
 */
export async function GET() {
  // Force request time (see note in app/api/safeguards/route.ts).
  await connection();
  return Response.json(listIncidents());
}

/**
 * POST /api/incidents
 * Body: CreateIncidentRequest. Returns: the stored Incident (201).
 * 400 for bad input, 409 if the id already exists.
 *
 * Storing an incident does NOT create a safeguard. The learning step
 * (Nithin's LLM logic) reads the incident and POSTs a safeguard with
 * learnedFromIncident set to this incident's id.
 */
export async function POST(request: Request) {
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const input = validateCreateIncident(parsed.body);
  if (!input.ok) return errorResponse(400, input.error);

  const incident: Incident = {
    ...input.value,
    id: input.value.id ?? `inc_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };

  if (!addIncident(incident)) {
    return errorResponse(409, `An incident with id "${incident.id}" already exists.`);
  }
  const agent = findAgent(incident.action.agentId);
  if (agent) { agent.incidents++; activity(agent.businessId, "INCIDENT_REPORTED", incident.description, agent.id); }
  return Response.json(incident, { status: 201 });
}
