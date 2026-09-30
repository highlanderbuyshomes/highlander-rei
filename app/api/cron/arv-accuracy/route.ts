import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { recordArvAccuracyRun } from "@/lib/search/backtest";

// Weekly ARV accuracy run for Settings > ARV Accuracy, called by
// .github/workflows/arv-accuracy.yml. The repo is public, so the response
// carries no results — they stay in the database.
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

async function handle(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const run = await recordArvAccuracyRun();
    return NextResponse.json({ ok: true, durationMs: run.durationMs });
  } catch (err) {
    console.error("[cron/arv-accuracy] failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
