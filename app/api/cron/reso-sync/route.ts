import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncResoListings } from "@/lib/integrations/reso-sync";
import { isResoConfigured } from "@/lib/integrations/reso";
import { PLAN_STATUSES, resolveSyncPlan } from "@/lib/integrations/reso-sync-plan";

// Live MLS feed: called every ~10 minutes by .github/workflows/reso-sync.yml
// (Vercel cron on the Hobby plan only runs daily). Pulls just what changed
// in ARMLS since the last fully-successful run.
export const maxDuration = 300;

const SOURCE = "reso-incremental";
// A run still marked "running" this recently is treated as in progress.
const OVERLAP_GUARD_MS = 6 * 60_000;
// Stop starting new pages after this, leaving headroom under maxDuration.
const TIME_BUDGET_MS = 200_000;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

async function handle(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isResoConfigured()) return NextResponse.json({ error: "RESO_ACCESS_TOKEN must be set" }, { status: 400 });

  const inFlight = await prisma.importRun.findFirst({
    where: { source: SOURCE, status: "running", startedAt: { gt: new Date(Date.now() - OVERLAP_GUARD_MS) } },
    select: { id: true },
  });
  if (inFlight) return NextResponse.json({ skipped: "previous run still in progress" });

  // The feed can be too big for one 300s invocation (first pull especially),
  // so a run stops at a time budget, saves a "partial" resume point, and the
  // next run picks up from it. `watermark` is when the logical sync began —
  // carried through continuations. A run that reached the end of the feed
  // (completed or completed_with_errors) advances it; see resolveSyncPlan.
  const latest = await prisma.importRun.findFirst({
    where: { source: SOURCE, status: { in: PLAN_STATUSES } },
    orderBy: { startedAt: "desc" },
    select: { status: true, rawMeta: true },
  });
  const { scope, control } = resolveSyncPlan(latest);
  control.deadline = Date.now() + TIME_BUDGET_MS;

  try {
    const result = await syncResoListings(scope, SOURCE, control);
    console.log("[reso/cron] scope:", JSON.stringify(scope), "result:", JSON.stringify({ ...result, errors: result.errors.slice(0, 5) }));
    return NextResponse.json({ ...result, partial: Boolean(result.resumeUrl) });
  } catch (err) {
    console.error("[reso/cron] failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
