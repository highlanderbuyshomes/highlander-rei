import { hasConditionLanguage, hasMotivatedLanguage } from "@/lib/distress";
import { normalizeStatus } from "./classify";
import type { ArvEstimate, AsIsEstimate } from "./comps";
import type { DealCandidate, ListingRecord } from "./types";

export { normalizeStatus };

/** Outside this % of ARV the price or size data is wrong (bad sqft, $1
 *  placeholders, land value), so no ARV is shown rather than a nonsense ratio. */
export const SUSPECT_ARV_PCT = 35;
export const MAX_ARV_PCT = 300;

/** An ARV range up to ±this % is normal; each point beyond it marks the
 *  ARV down a point for scoring and max offer (wide = conservative end). */
export const NORMAL_ARV_RANGE_PCT = 10;

/** Listed at or below this % of the clean as-is value = below market before any remodel. */
export const BELOW_AS_IS_PCT = 90;

/** "Target now" needs at least this many sold comps behind its ARV. */
export const MIN_TARGET_COMPS = 5;

/** Can't be bought today (sold or already under contract), so never "Target now". */
const UNAVAILABLE = ["Closed", "Pending", "Under Contract"];

export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const groupKey = (zip: string, type: string) => `${zip}\u0000${type}`;

function pushTo(map: Map<string, number[]>, key: string, value: number) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

/**
 * `estimate` supplies the sold-comps ARV (see comps.ts). Without it — or when
 * it finds too few comps — the ARV falls back to a third-party property
 * estimate, then to the asking-price pocket model. Only a sold-comps ARV of
 * High/Medium confidence (or a property estimate) can make a listing
 * "Target now"; asking-price models are too noisy to act on.
 */
export function scoreDeals(
  listings: ListingRecord[],
  threshold: number,
  estimate?: (listing: ListingRecord) => ArvEstimate | null,
  asIsEstimate?: (listing: ListingRecord) => AsIsEstimate | null,
): DealCandidate[] {
  // Pocket = same zip + dwelling type; fallback = same dwelling type; last
  // resort = all listings. Each group's median is computed once, not per listing.
  const allValues: number[] = [];
  const pocketValues = new Map<string, number[]>();
  const typeValues = new Map<string, number[]>();
  for (const item of listings) {
    if (!(item.listPrice && item.sqft)) continue;
    const value = item.listPrice / item.sqft;
    allValues.push(value);
    pushTo(pocketValues, groupKey(item.zip, item.dwellingType), value);
    pushTo(typeValues, item.dwellingType, value);
  }
  const pocketStats = new Map([...pocketValues].map(([k, v]) => [k, { count: v.length, median: median(v) }] as const));
  const typeMedians = new Map([...typeValues].map(([k, v]) => [k, median(v)] as const));
  const overallMedian = median(allValues);

  return listings.map((listing) => {
    const pricePerSqft = listing.listPrice && listing.sqft ? listing.listPrice / listing.sqft : null;
    const pocket = pocketStats.get(groupKey(listing.zip, listing.dwellingType));
    const comparableMedian = pocket && pocket.count >= 2 ? pocket.median : (typeMedians.get(listing.dwellingType) ?? null);
    const pocketPricePerSqft = comparableMedian ?? overallMedian;
    const modeledArv = listing.sqft && pocketPricePerSqft ? listing.sqft * pocketPricePerSqft : null;
    const comps = estimate?.(listing) ?? null;
    const estimatedArv = comps?.arv ?? listing.estimatedArv ?? modeledArv;
    // A sale is judged on what it sold for; everything else on its asking price.
    const price = listing.closePrice ?? listing.listPrice;
    const rawPct = price && estimatedArv ? (price / estimatedArv) * 100 : null;
    const implausible = rawPct != null && (rawPct < SUSPECT_ARV_PCT || rawPct > MAX_ARV_PCT);
    const arv = implausible ? null : estimatedArv;
    const arvSource: DealCandidate["arvSource"] = !arv ? "Insufficient data" : comps ? comps.method : listing.estimatedArv ? "Property estimate" : "Pocket $/sqft model";
    const arvConfidence: DealCandidate["arvConfidence"] = !arv ? null : comps ? comps.confidence : listing.estimatedArv ? "Medium" : "Low";
    const listToArvPct = implausible ? null : rawPct;
    const asIsValue = asIsEstimate?.(listing)?.value ?? null;
    const pctOfAsIs = price && asIsValue ? (price / asIsValue) * 100 : null;
    const arvRangePct = arv && comps ? comps.rangePct : null;
    const conservativeArv = !arv ? null : Math.round(arv * (1 - Math.max(0, (arvRangePct ?? 0) - NORMAL_ARV_RANGE_PCT) / 100));
    // Scoring and max offer use the conservative ARV; the shown % stays the plain one.
    const dealPct = price && conservativeArv && listToArvPct != null ? (price / conservativeArv) * 100 : null;
    // Only a sold-comps ARV backed by enough sales can drive "Target now".
    const actionableArv = (arvConfidence === "High" || arvConfidence === "Medium") && (comps == null || comps.compCount >= MIN_TARGET_COMPS);
    const rule70Price = conservativeArv ? Math.round(conservativeArv * (threshold / 100)) : null;
    const rule70Spread = rule70Price != null && listing.listPrice != null ? rule70Price - listing.listPrice : null;
    const rawPpsfDiscount = pricePerSqft && pocketPricePerSqft ? ((pocketPricePerSqft - pricePerSqft) / pocketPricePerSqft) * 100 : null;
    const ppsfDiscountPct = rawPpsfDiscount != null && rawPpsfDiscount >= -200 ? rawPpsfDiscount : null;
    const conditionSignal = listing.distressSignal ?? hasConditionLanguage(listing.remarks);
    const motivatedSignal = listing.motivatedSignal ?? hasMotivatedLanguage(listing.remarks);
    const status = normalizeStatus(listing.status);
    const priceReductionPct = listing.originalListPrice && listing.listPrice && listing.originalListPrice > listing.listPrice ? ((listing.originalListPrice - listing.listPrice) / listing.originalListPrice) * 100 : 0;
    const reasons: string[] = [];
    let score = 0;
    const scoreFields = { arv, arvSource, arvConfidence, arvCompCount: arv && comps ? comps.compCount : null, arvRadiusMiles: arv && comps ? comps.radiusMiles : null, arvSameSubdivision: Boolean(arv && comps?.sameSubdivision), arvCompBasis: arv && comps ? comps.basis : null, arvRangePct, conservativeArv, asIsValue, pctOfAsIs, listToArvPct, rule70Price, rule70Spread, pricePerSqft, pocketPricePerSqft, ppsfDiscountPct };

    if (status === "Closed") {
      // Sold listings are comps, not opportunities; say what it sold at.
      if (listToArvPct != null) reasons.push(`Sold at ${Math.round(listToArvPct)}% of ARV`);
      return { ...listing, ...scoreFields, dealScore: 0, priority: "Low" as const, reasons };
    }

    const arvLabel = actionableArv ? "projected ARV" : "rough ARV (verify)";
    if (listToArvPct != null && dealPct != null) {
      const lowEnd = Math.round(dealPct) !== Math.round(listToArvPct) ? ` (${Math.round(dealPct)}% at the low end)` : "";
      const reason = `${Math.round(listToArvPct)}% of ${arvLabel}${lowEnd}`;
      if (dealPct <= threshold) { score += 50 + Math.min(15, threshold - dealPct); reasons.push(reason); }
      else if (dealPct <= threshold + 10) { score += 32; reasons.push(reason); }
      else if (dealPct <= threshold + 20) score += 15;
    }
    if (pctOfAsIs != null && pctOfAsIs <= BELOW_AS_IS_PCT) { score += 12 + Math.min(8, BELOW_AS_IS_PCT - pctOfAsIs); reasons.push(`${Math.round(pctOfAsIs)}% of clean as-is`); }
    if (ppsfDiscountPct != null && ppsfDiscountPct >= 15) { score += Math.min(16, Math.round(ppsfDiscountPct / 2)); reasons.push(`${Math.round(ppsfDiscountPct)}% below pocket $/sqft`); }
    if (["Expired", "Canceled"].includes(status)) { score += 14; reasons.push(`${status} listing`); }
    if ((listing.dom ?? 0) >= 60) { score += 8; reasons.push(`${listing.dom} days on market`); }
    if ((listing.estimatedEquityPct ?? 0) >= 40) { score += 7; reasons.push(`${Math.round(listing.estimatedEquityPct!)}% estimated equity`); }
    if (listing.ownerOccupied === false) { score += 4; reasons.push("Absentee owner"); }
    if (motivatedSignal) { score += 12; reasons.push("Motivated seller language"); }
    if (conditionSignal) { score += 10; reasons.push("Fixer / condition language"); }
    if (priceReductionPct >= 5) { score += 6; reasons.push(`${Math.round(priceReductionPct)}% price reduction`); }

    if (UNAVAILABLE.includes(status)) reasons.push(`${status} — backup offer only`);

    score = Math.min(99, Math.round(score));
    const meetsRule = dealPct != null && dealPct <= threshold;
    let priority: DealCandidate["priority"] = meetsRule && actionableArv ? "Target now" : score >= 65 ? "High" : score >= 38 ? "Watch" : "Low";
    if (UNAVAILABLE.includes(status) && (priority === "Target now" || priority === "High")) priority = "Watch";
    return { ...listing, ...scoreFields, dealScore: score, priority, reasons: reasons.slice(0, 4) };
  }).sort((a, b) => b.dealScore - a.dealScore || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
