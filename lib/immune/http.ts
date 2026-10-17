import type { ApiError } from "@/shared/types";

/** Small helpers shared by the IMMUNE route handlers. */

export function errorResponse(status: number, error: string): Response {
  const body: ApiError = { error };
  return Response.json(body, { status });
}

/** Parse a JSON request body, or return a 400 response if it is not JSON. */
export async function readJson(
  request: Request,
): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false, response: errorResponse(400, "Request body must be valid JSON.") };
  }
}
