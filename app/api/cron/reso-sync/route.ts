import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncResoListings } from "@/lib/integrations/reso-sync";
import { isResoConfigured } from "@/lib/integrations/reso";
import { PLAN_STATUSES, resolveSyncPlan } from "@/lib/integrations/reso-sync-plan";
import { RENTAL_SOURCE, resolveRentalPlan, syncRentalListings, type RentalSyncResult } from "@/lib/integrations/rental-sync";

// Live MLS feed: called every ~10 minutes by .github/workflows/reso-sync.yml
// (Vercel cron on the Hobby plan only runs daily). Pulls just what changed
// in ARMLS since the last fully-successful run.
export const maxDuration = 300;

const SOURCE = "reso-incremental";
// A run still marked "running" this recently is treated as in progress.
const OVERLAP_GUARD_MS = 6 * 60_000;
// Well past maxDuration: a "running" run this old was killed mid-flight.
const STALE_RUN_MS = 15 * 60_000;
// Stop starting new pages after this, leaving headroom under maxDuration.
const TIME_BUDGET_MS = 200_000;
// Neon's plan storage cap. At the cap every write in the app fails (not just
// MLS), so bootstrap pages stop at BOOTSTRAP_MAX_SHARE of it; the small
// incremental pulls keep running.
const DB_CAP_BYTES = Number(process.env.DB_SIZE_CAP_MB || 512) * 1024 * 1024;
const BOOTSTRAP_MAX_SHARE = 0.85;
// The rental pass runs after the sales pass only if it can start by
// RENTAL_START_BY and stop by RENTAL_DEADLINE (ms since the request began).
const RENTAL_START_BY = 230_000;
const RENTAL_DEADLINE = 260_000;

async function databaseBytes(): Promise<number> {
  const [row] = await prisma.$queryRaw<{ bytes: bigint }[]>`SELECT pg_database_size(current_database()) AS bytes`;
  return Number(row.bytes);
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/**
 * Rental listings for Investor comps. The first passes load 24 months in
 * resumable chunks (paused near the DB size cap, like the sales bootstrap);
 * after that, just what changed. Never fails the sales sync.
 */
async function syncRentals(started: number): Promise<RentalSyncResult | { skipped: string } | { error: string }> {
  if (Date.now() > started + RENTAL_START_BY) return { skipped: "no time left" };
  try {
    const latest = await prisma.importRun.findFirst({
      where: { source: RENTAL_SOURCE, status: { in: ["completed", "partial"] } },
      orderBy: { startedAt: "desc" },
      select: { status: true, rawMeta: true },
    });
    const plan = resolveRentalPlan(latest, new Date(started));
    if (plan.kind !== "incremental" && (await databaseBytes()) > DB_CAP_BYTES * BOOTSTRAP_MAX_SHARE) {
      return { skipped: "rental backfill paused near database size cap" };
    }
    return await syncRentalListings(plan.scope, { ...plan.control, deadline: started + RENTAL_DEADLINE });
  } catch (err) {
    console.error("[reso/cron] rental pass failed:", err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function handle(req: NextRequest) {
  const started = Date.now();
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isResoConfigured()) return NextResponse.json({ error: "RESO_ACCESS_TOKEN must be set" }, { status: 400 });

  // A run killed by the function timeout never records its end; close those
  // out so they don't sit as "running" forever.
  await prisma.importRun.updateMany({
    where: { source: { startsWith: "reso" }, status: "running", startedAt: { lt: new Date(Date.now() - STALE_RUN_MS) } },
    data: { status: "failed", completedAt: new Date(), errorMessage: "Timed out (no completion recorded)" },
  });

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
  const { kind, scope, control } = resolveSyncPlan(latest);
  if (kind !== "incremental") {
    const bytes = await databaseBytes();
    if (bytes > DB_CAP_BYTES * BOOTSTRAP_MAX_SHARE) {
      const mb = (n: number) => Math.round(n / 1024 / 1024);
      console.warn(`[reso/cron] bootstrap paused: database ${mb(bytes)} MB of ${mb(DB_CAP_BYTES)} MB cap`);
      return NextResponse.json({ skipped: "bootstrap paused near database size cap", databaseMb: mb(bytes), capMb: mb(DB_CAP_BYTES) });
    }
  }
  control.deadline = Date.now() + TIME_BUDGET_MS;

  try {
    const result = await syncResoListings(scope, SOURCE, control);
    console.log("[reso/cron] scope:", JSON.stringify(scope), "result:", JSON.stringify({ ...result, errors: result.errors.slice(0, 5) }));
    const rentals = await syncRentals(started);
    return NextResponse.json({ ...result, partial: Boolean(result.resumeUrl), rentals });
  } catch (err) {
    console.error("[reso/cron] failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
