import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncResoListings } from "@/lib/integrations/reso-sync";
import { isResoConfigured } from "@/lib/integrations/reso";

// Live MLS feed: called every ~10 minutes by .github/workflows/reso-sync.yml
// (Vercel cron on the Hobby plan only runs daily). Pulls just what changed
// in ARMLS since the last fully-successful run.
export const maxDuration = 300;

const SOURCE = "reso-incremental";
// Re-fetch a little before the last run's start so a listing modified while
// that run was mid-flight isn't missed; writes are idempotent.
const OVERLAP_MS = 5 * 60_000;
// A run still marked "running" this recently is treated as in progress.
const OVERLAP_GUARD_MS = 6 * 60_000;
// First run ever (no watermark): pull the live statuses in full.
const BOOTSTRAP_STATUSES = ["Active", "Active Under Contract", "Pending"];

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

  // Only a fully clean run advances the watermark, so records that errored
  // are retried next time instead of being skipped past.
  const last = await prisma.importRun.findFirst({
    where: { source: SOURCE, status: "completed" },
    orderBy: { startedAt: "desc" },
    select: { startedAt: true },
  });

  const scope = last
    ? { modifiedSince: new Date(last.startedAt!.getTime() - OVERLAP_MS).toISOString() }
    : { statuses: BOOTSTRAP_STATUSES };

  try {
    const result = await syncResoListings(scope, SOURCE);
    console.log("[reso/cron] scope:", JSON.stringify(scope), "result:", JSON.stringify({ ...result, errors: result.errors.slice(0, 5) }));
    return NextResponse.json(result);
  } catch (err) {
    console.error("[reso/cron] failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
