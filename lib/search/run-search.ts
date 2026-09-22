import { isPointInsideShape } from "@/lib/filter-listings";
import { estimateArv, type CompIndex } from "./comps";
import { loadCandidates, loadRowsByIds } from "./load";
import { loadCompIndex } from "./load-comps";
import { scoreDeals } from "./score-deals";
import type { CompSale, DealCandidate, DrawnShape, ListingDetailResponse, ListingRecord, Pin, SearchRequest, SearchResponse } from "./types";
import { MAX_PINS, PAGE_SIZE } from "./types";

export function applyShape<T extends { latitude: number | null; longitude: number | null }>(
  rows: T[],
  shape: DrawnShape | null | undefined,
): T[] {
  if (!shape) return rows;
  return rows.filter((r) => r.latitude != null && r.longitude != null && isPointInsideShape(r.latitude, r.longitude, shape));
}

/** Score-ordered pins for rows with coordinates, capped at MAX_PINS. */
export function capPins(scored: DealCandidate[], max: number = MAX_PINS): Pin[] {
  const pins: Pin[] = [];
  for (const d of scored) {
    if (pins.length >= max) break;
    if (d.latitude == null || d.longitude == null) continue;
    pins.push({ id: d.id, lat: d.latitude, lng: d.longitude, price: d.listPrice, status: d.status, target: d.priority === "Target now" });
  }
  return pins;
}

const clampThreshold = (value: number) => Math.min(99, Math.max(1, Math.round(value)));
const arvFrom = (index: CompIndex) => (listing: ListingRecord) => estimateArv(listing, index);

/** Score fields computed by scoreDeals, copied onto the full display rows. */
function scoreFieldsOf(d: DealCandidate) {
  const { arv, arvSource, arvConfidence, arvCompCount, arvRadiusMiles, arvSameSubdivision, listToArvPct, rule70Price, rule70Spread, pricePerSqft, pocketPricePerSqft, ppsfDiscountPct, dealScore, priority, reasons } = d;
  return { arv, arvSource, arvConfidence, arvCompCount, arvRadiusMiles, arvSameSubdivision, listToArvPct, rule70Price, rule70Spread, pricePerSqft, pocketPricePerSqft, ppsfDiscountPct, dealScore, priority, reasons };
}

export async function runSearch(req: SearchRequest): Promise<SearchResponse> {
  const threshold = clampThreshold(req.arvThreshold);
  const page = Math.max(0, Math.floor(req.page ?? 0));

  const [loaded, index] = await Promise.all([loadCandidates(req.filters), loadCompIndex()]);
  const candidates = applyShape(loaded, req.shape);
  const scored = scoreDeals(candidates, threshold, arvFrom(index)); // already sorted by score desc

  const pins = capPins(scored);

  const pageIds = scored.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((d) => d.id);
  const full = await loadRowsByIds(pageIds);
  const byId = new Map(scored.map((d) => [d.id, d]));

  // Full rows carry the real display data (address, city, beds, ...); the
  // light scored rows carry only the score fields plus a bunch of fields
  // defaulted to null. Pick the score fields explicitly rather than
  // spreading the whole scored row, so those nulls never clobber real data.
  const rows: DealCandidate[] = full.map((r) => ({ ...r, ...scoreFieldsOf(byId.get(r.id)!) }));

  return { total: scored.length, pins, rows, targetCount: scored.filter((d) => d.priority === "Target now").length, compCount: index.byId.size };
}

/**
 * One listing scored on its own, with the closed sales behind its ARV. The
 * asking-price pocket fields are meaningless for a single row, but the
 * sold-comps ARV, % of ARV and priority match what the search showed.
 */
export async function loadListingDetail(id: string, arvThreshold: number): Promise<ListingDetailResponse | null> {
  const [[row], index] = await Promise.all([loadRowsByIds([id]), loadCompIndex()]);
  if (!row) return null;
  const est = estimateArv(row, index);
  const [scored] = scoreDeals([row], clampThreshold(arvThreshold), () => est);
  const comps: CompSale[] = (est?.comps ?? []).flatMap(({ id: compId, distanceMiles }) => {
    const c = index.byId.get(compId);
    if (!c) return [];
    return [{ id: c.id, address: c.address, city: c.city, price: c.price, sqft: c.sqft, pricePerSqft: c.price / c.sqft, beds: c.beds, yearBuilt: c.yearBuilt, closedDate: new Date(c.closedAt).toISOString(), distanceMiles }];
  });
  return { ...scored, comps };
}
