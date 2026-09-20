import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/session";
import { runSearch } from "@/lib/search/run-search";
import type { SearchRequest } from "@/lib/search/types";

export const maxDuration = 60;

const MAX_LIST = 200;
const MAX_SHAPE_POINTS = 2000;
const NUMERIC_FILTERS = ["closedWithinMonths", "priceMin", "priceMax", "bedsMin", "bathsMin", "sqftMin", "sqftMax", "lotMin", "lotMax"] as const;

function validateBody(body: SearchRequest): string | null {
  const f = body.filters as Record<string, unknown>;
  if (!f) return "filters are required";
  for (const key of ["statuses", "dwellingTypes", "zips"]) {
    const v = f[key];
    if (v !== undefined && (!Array.isArray(v) || v.length > MAX_LIST)) return `filters.${key} must be an array of at most ${MAX_LIST} entries`;
  }
  for (const key of NUMERIC_FILTERS) {
    if (f[key] != null && (typeof f[key] !== "number" || !Number.isFinite(f[key]))) return `filters.${key} must be a finite number`;
  }
  if (f.levels !== undefined && f.levels !== "3+" && (typeof f.levels !== "number" || !Number.isFinite(f.levels))) return "filters.levels must be a finite number or \"3+\"";
  if (!Number.isFinite(body.arvThreshold)) return "arvThreshold must be a finite number";
  const path = (body.shape as { path?: unknown } | null | undefined)?.path;
  if (Array.isArray(path) && path.length > MAX_SHAPE_POINTS) return `shape.path must have at most ${MAX_SHAPE_POINTS} points`;
  return null;
}

export async function POST(req: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: SearchRequest;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body.filters !== "object" || typeof body.arvThreshold !== "number") {
    return NextResponse.json({ error: "filters and arvThreshold are required" }, { status: 400 });
  }
  const bad = validateBody(body);
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  try {
    return NextResponse.json(await runSearch(body));
  } catch (err) {
    console.error("[admin/search] failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
