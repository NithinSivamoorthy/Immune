import { connection } from "next/server";
import type { Safeguard } from "@/shared/types";
import { toFrontendSafeguard } from "@/lib/immune/frontend";
import { errorResponse, readJson } from "@/lib/immune/http";
import { addSafeguard, listSafeguards } from "@/lib/immune/store";
import { validateCreateSafeguard } from "@/lib/immune/validate";

/**
 * GET /api/safeguards
 * Returns: Safeguard[] (200).
 * GET /api/safeguards?format=frontend returns FrontendSafeguard[] instead
 * (the shape Nithin's dashboard uses: title, detail, outcome, active, ...).
 */
export async function GET(request: Request) {
  // cacheComponents is on: without this, Next.js could prerender this GET at
  // build time and serve a frozen list. connection() forces request time.
  await connection();
  const safeguards = listSafeguards();
  const format = new URL(request.url).searchParams.get("format");
  return Response.json(format === "frontend" ? safeguards.map(toFrontendSafeguard) : safeguards);
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
  return Response.json(safeguard, { status: 201 });
}
