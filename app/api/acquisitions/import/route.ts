import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { startApifyRun, pollApifyRun, ingestApifyDataset } from "@/lib/apify-adapter";

export async function POST(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "start") {
    const { actorId, input } = body;
    if (!actorId) return NextResponse.json({ error: "actorId is required" }, { status: 400 });

    const result = await startApifyRun(actorId, input ?? {});
    return NextResponse.json(result);
  }

  if (action === "poll") {
    const { apifyRunId } = body;
    if (!apifyRunId) return NextResponse.json({ error: "apifyRunId is required" }, { status: 400 });

    const result = await pollApifyRun(apifyRunId);
    return NextResponse.json(result);
  }

  if (action === "ingest") {
    const { importRunId, apifyRunId, fieldMapping } = body;
    if (!importRunId || !apifyRunId) {
      return NextResponse.json({ error: "importRunId and apifyRunId are required" }, { status: 400 });
    }

    const result = await ingestApifyDataset(importRunId, apifyRunId, fieldMapping);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
