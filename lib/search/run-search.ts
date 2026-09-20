import { isPointInsideShape } from "@/lib/filter-listings";
import { loadCandidates, loadRowsByIds } from "./load";
import { scoreDeals } from "./score-deals";
import type { DealCandidate, DrawnShape, Pin, SearchRequest, SearchResponse } from "./types";
import { PAGE_SIZE } from "./types";

export function applyShape<T extends { latitude: number | null; longitude: number | null }>(
  rows: T[],
  shape: DrawnShape | null | undefined,
): T[] {
  if (!shape) return rows;
  return rows.filter((r) => r.latitude != null && r.longitude != null && isPointInsideShape(r.latitude, r.longitude, shape));
}

export async function runSearch(req: SearchRequest): Promise<SearchResponse> {
  const threshold = Math.min(99, Math.max(1, Math.round(req.arvThreshold)));
  const page = Math.max(0, Math.floor(req.page ?? 0));

  const candidates = applyShape(await loadCandidates(req.filters), req.shape);
  const scored = scoreDeals(candidates, threshold); // already sorted by score desc

  const pins: Pin[] = scored
    .filter((d) => d.latitude != null && d.longitude != null)
    .map((d) => ({ id: d.id, lat: d.latitude!, lng: d.longitude!, price: d.listPrice, status: d.status, target: d.priority === "Target now" }));

  const pageIds = scored.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((d) => d.id);
  const full = await loadRowsByIds(pageIds);
  const byId = new Map(scored.map((d) => [d.id, d]));

  // Full rows carry the real display data (address, city, beds, ...); the
  // light scored rows carry only the score fields plus a bunch of fields
  // defaulted to null. Pick the score fields explicitly rather than
  // spreading the whole scored row, so those nulls never clobber real data.
  const rows: DealCandidate[] = full.map((r) => {
    const scoredRow = byId.get(r.id)!;
    const { arv, arvSource, listToArvPct, rule70Price, rule70Spread, pricePerSqft, pocketPricePerSqft, ppsfDiscountPct, dealScore, priority, reasons } = scoredRow;
    return { ...r, arv, arvSource, listToArvPct, rule70Price, rule70Spread, pricePerSqft, pocketPricePerSqft, ppsfDiscountPct, dealScore, priority, reasons };
  });

  return { total: scored.length, pins, rows, targetCount: scored.filter((d) => d.priority === "Target now").length };
}
