import { findAgent, activity } from "@/lib/dashboard/store";
import { getIncident } from "@/lib/immune/store";
import { connection } from "next/server";
import type { Safeguard } from "@/shared/types";
import { errorResponse, readJson } from "@/lib/immune/http";
import { addSafeguard, listSafeguards } from "@/lib/immune/store";
import { validateCreateSafeguard } from "@/lib/immune/validate";

/**
 * GET /api/safeguards
 * Returns: Safeguard[] (200).
 */
export async function GET() {
  // cacheComponents is on: without this, Next.js could prerender this GET at
  // build time and serve a frozen list. connection() forces request time.
  await connection();
  return Response.json(listSafeguards());
}

/**
 * POST /api/safeguards
 * Body: CreateSafeguardRequest. Returns: the stored Safeguard (201).
 * 400 for bad input, 409 if the id already exists.
 */
export async function POST(request: Request) {
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const input = validateCreateSafeguard(parsed.body);
  if (!input.ok) return errorResponse(400, input.error);

  const safeguard: Safeguard = {
    ...input.value,
    id: input.value.id ?? `sg_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };

  if (!addSafeguard(safeguard)) {
    return errorResponse(409, `A safeguard with id "${safeguard.id}" already exists.`);
  }
  const incident = safeguard.learnedFromIncident ? getIncident(safeguard.learnedFromIncident) : undefined;
  const agent = incident ? findAgent(incident.action.agentId) : undefined;
  if (agent) activity(agent.businessId, "SAFEGUARD_LEARNED", safeguard.name, agent.id);
  return Response.json(safeguard, { status: 201 });
}
