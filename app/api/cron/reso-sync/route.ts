import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncResoListings, type ResoSyncControl } from "@/lib/integrations/reso-sync";
import { isResoConfigured, type ResoScopeOpts } from "@/lib/integrations/reso";

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
// Stop starting new pages after this, leaving headroom under maxDuration.
const TIME_BUDGET_MS = 200_000;
// First run ever (no watermark): pull the live statuses in full, statewide
// (no zip/city restriction — all of ARMLS). Incremental runs afterwards pick up
// Coming Soon and every status change.
// Bump SCOPE_VERSION when the sync scope widens: older completed runs are then
// treated as having no watermark, forcing one fresh bootstrap.
const SCOPE_VERSION = 2;
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

  // The feed can be too big for one 300s invocation (first pull especially),
  // so a run stops at a time budget, saves a "partial" resume point, and the
  // next run picks up from it. `watermark` is when the logical sync began —
  // carried through continuations — and only a fully clean run makes it the
  // next incremental start, so records that errored are retried, not skipped.
  const latest = await prisma.importRun.findFirst({
    where: { source: SOURCE, status: { in: ["completed", "partial"] } },
    orderBy: { startedAt: "desc" },
    select: { status: true, startedAt: true, rawMeta: true },
  });
  const meta = (latest?.rawMeta ?? {}) as { watermark?: string; resumeUrl?: string; scope?: ResoScopeOpts; scopeVersion?: number };
  const startedNow = new Date().toISOString();

  let scope: ResoScopeOpts;
  let control: ResoSyncControl;
  // Runs from before the full-MLS widening (scopeVersion !== 2) covered only the
  // old service area; their watermark/resume point must not be reused.
  const current = meta.scopeVersion === SCOPE_VERSION;
  if (latest?.status === "partial" && current && meta.resumeUrl && meta.scope && meta.watermark) {
    scope = meta.scope;
    control = { resumeUrl: meta.resumeUrl, meta: { watermark: meta.watermark, scope, scopeVersion: SCOPE_VERSION } };
  } else if (latest?.status === "completed" && current && meta.watermark) {
    scope = { modifiedSince: new Date(new Date(meta.watermark).getTime() - OVERLAP_MS).toISOString() };
    control = { meta: { watermark: startedNow, scope, scopeVersion: SCOPE_VERSION } };
  } else {
    scope = { statuses: BOOTSTRAP_STATUSES };
    control = { meta: { watermark: startedNow, scope, scopeVersion: SCOPE_VERSION } };
  }
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
