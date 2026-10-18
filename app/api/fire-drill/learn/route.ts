import { learnFinding } from "@/lib/dashboard/fire-drill";
import { dashboardStore } from "@/lib/dashboard/store";
import { errorResponse, readJson } from "@/lib/immune/http";
export async function POST(request: Request) {
  const parsed = await readJson(request); if (!parsed.ok) return parsed.response;
  const body = parsed.body as { runId?: string; resultId?: string } | null;
  const run = dashboardStore().runs.find(r => r.id === body?.runId);
  if (!run || !body?.resultId) return errorResponse(404, "Run or finding not found.");
  try { return Response.json(await learnFinding(run, body.resultId, request.url)); }
  catch (error) { return errorResponse(409, error instanceof Error ? error.message : "Learning failed."); }
}
