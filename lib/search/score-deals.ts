import { hasDistressLanguage } from "@/lib/distress";
import type { DealCandidate, ListingRecord } from "./types";

export function normalizeStatus(value: string) {
  const status = value.toLowerCase();
  if (status.includes("coming")) return "Coming Soon";
  if (status.includes("active")) return "Active";
  if (status.includes("pending") || status.includes("contract")) return "Pending";
  if (status.includes("expire")) return "Expired";
  if (status.includes("cancel") || status.includes("withdraw")) return "Canceled";
  if (status.includes("closed") || status.includes("sold")) return "Closed";
  return value || "Off Market";
}

export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function scoreDeals(listings: ListingRecord[], threshold: number): DealCandidate[] {
  const ppsfRows = listings.filter((item) => item.listPrice && item.sqft).map((item) => ({
    zip: item.zip,
    type: item.dwellingType,
    value: item.listPrice! / item.sqft!,
  }));

  return listings.map((listing) => {
    const pricePerSqft = listing.listPrice && listing.sqft ? listing.listPrice / listing.sqft : null;
    const pocketRows = ppsfRows.filter((row) => row.zip === listing.zip && row.type === listing.dwellingType);
    const comparableRows = pocketRows.length >= 2 ? pocketRows : ppsfRows.filter((row) => row.type === listing.dwellingType);
    const pocketPricePerSqft = median(comparableRows.map((row) => row.value)) ?? median(ppsfRows.map((row) => row.value));
    const modeledArv = listing.sqft && pocketPricePerSqft ? listing.sqft * pocketPricePerSqft : null;
    const arv = listing.estimatedArv ?? modeledArv;
    const arvSource: DealCandidate["arvSource"] = listing.estimatedArv ? "Property estimate" : modeledArv ? "Pocket $/sqft model" : "Insufficient data";
    const listToArvPct = listing.listPrice && arv ? (listing.listPrice / arv) * 100 : null;
    const rule70Price = arv ? arv * (threshold / 100) : null;
    const rule70Spread = rule70Price != null && listing.listPrice != null ? rule70Price - listing.listPrice : null;
    const ppsfDiscountPct = pricePerSqft && pocketPricePerSqft ? ((pocketPricePerSqft - pricePerSqft) / pocketPricePerSqft) * 100 : null;
    const conditionSignal = listing.distressSignal ?? hasDistressLanguage(listing.remarks);
    const status = normalizeStatus(listing.status);
    const priceReductionPct = listing.originalListPrice && listing.listPrice && listing.originalListPrice > listing.listPrice ? ((listing.originalListPrice - listing.listPrice) / listing.originalListPrice) * 100 : 0;
    const reasons: string[] = [];
    let score = 0;

    if (listToArvPct != null) {
      if (listToArvPct <= threshold) { score += 50 + Math.min(15, threshold - listToArvPct); reasons.push(`${Math.round(listToArvPct)}% of projected ARV`); }
      else if (listToArvPct <= threshold + 10) { score += 32; reasons.push(`${Math.round(listToArvPct)}% of projected ARV`); }
      else if (listToArvPct <= threshold + 20) score += 15;
    }
    if (ppsfDiscountPct != null && ppsfDiscountPct >= 15) { score += Math.min(16, Math.round(ppsfDiscountPct / 2)); reasons.push(`${Math.round(ppsfDiscountPct)}% below pocket $/sqft`); }
    if (["Expired", "Canceled"].includes(status)) { score += 14; reasons.push(`${status} listing`); }
    if ((listing.dom ?? 0) >= 60) { score += 8; reasons.push(`${listing.dom} days on market`); }
    if ((listing.estimatedEquityPct ?? 0) >= 40) { score += 7; reasons.push(`${Math.round(listing.estimatedEquityPct!)}% estimated equity`); }
    if (listing.ownerOccupied === false) { score += 4; reasons.push("Absentee owner"); }
    if (conditionSignal) { score += 12; reasons.push("Fixer / condition language"); }
    if (priceReductionPct >= 5) { score += 6; reasons.push(`${Math.round(priceReductionPct)}% price reduction`); }

    score = Math.min(99, score);
    const priority: DealCandidate["priority"] = listToArvPct != null && listToArvPct <= threshold ? "Target now" : score >= 65 ? "High" : score >= 38 ? "Watch" : "Low";
    return { ...listing, arv, arvSource, listToArvPct, rule70Price, rule70Spread, pricePerSqft, pocketPricePerSqft, ppsfDiscountPct, dealScore: score, priority, reasons: reasons.slice(0, 4) };
  }).sort((a, b) => b.dealScore - a.dealScore);
}
