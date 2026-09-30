/**
 * Investor comps: what flippers and landlords have paid near a subject.
 * Deterministic, ARMLS-only (no model). An investor buy is a closed cash MLS
 * sale; what happened to the house next says who bought it:
 *   - back on the MLS for sale 30–365 days later → Flipper
 *   - listed for rent within a year (before any sale relist) → Landlord
 *   - held a year or more with no sale relist → Landlord
 * Anything else is too early to call and left out.
 */
import { ATTACHED_CLASSES, ATTACHED_MAX_MILES, milesBetween, percentile, subdivisionKey, type ArvSubject } from "./comps";

export type InvestorKind = "Flipper" | "Landlord";

export const FLIP_MIN_DAYS = 30;
export const FLIP_MAX_DAYS = 365;
export const RENTAL_MAX_DAYS = 365;
export const HOLD_DAYS = 365;
export const INVESTOR_RADII = [0.5, 1, 2] as const;
export const INVESTOR_PERIODS = [12, 24] as const;
/** Buys of a kind needed before that kind gets a price. */
export const MIN_PRICED_BUYS = 3;
/** The price is the median of this many best matches. */
export const PRICE_TOP_N = 5;
export const SMART_MATCH_TOP_N = 5;
export const SMART_MATCH_MIN_SCORE = 60;
const MAX_BUYS = 100;

const DAY_MS = 24 * 3600_000;
const MONTH_MS = 30.44 * DAY_MS;
const CELL = 0.01; // degrees ≈ 0.7 mi of latitude

export function classifyInvestorBuy(e: { soldAt: number; relistAt: number | null; rentalAt: number | null }, now: number): InvestorKind | null {
  const relistDays = e.relistAt == null ? null : (e.relistAt - e.soldAt) / DAY_MS;
  const rentalDays = e.rentalAt == null ? null : (e.rentalAt - e.soldAt) / DAY_MS;
  if (relistDays != null && relistDays < FLIP_MIN_DAYS) return null;
  const rentalFirst = rentalDays != null && rentalDays <= RENTAL_MAX_DAYS && (relistDays == null || rentalDays < relistDays);
  if (rentalFirst) return "Landlord";
  if (relistDays != null && relistDays <= FLIP_MAX_DAYS) return "Flipper";
  if (now - e.soldAt >= HOLD_DAYS * DAY_MS) return "Landlord";
  return null;
}

export type InvestorBuyRecord = {
  /** MlsListing id of the purchase. */
  id: string;
  /** Property id: search rows (and so the subject) are keyed by it. */
  propertyId: string;
  lat: number;
  lng: number;
  sqft: number;
  beds: number | null;
  baths: number | null;
  yearBuilt: number | null;
  dwelling: string;
  /** Normalized subdivision key (see subdivisionKey), or null. */
  subdivision: string | null;
  price: number;
  soldAt: number; // epoch ms
  address: string;
  city: string;
  kind: InvestorKind;
  /** Flipper: the relist that followed (sold price if closed, else list price). */
  exit: { price: number | null; at: number; status: string } | null;
  /** Landlord: monthly rent from the rental listing, when there was one. */
  rent: number | null;
};

export type InvestorIndex = { cells: Map<string, InvestorBuyRecord[]> };

const cellKey = (x: number, y: number) => `${x},${y}`;

export function buildInvestorIndex(buys: InvestorBuyRecord[]): InvestorIndex {
  const cells = new Map<string, InvestorBuyRecord[]>();
  for (const b of buys) {
    const key = cellKey(Math.floor(b.lat / CELL), Math.floor(b.lng / CELL));
    const cell = cells.get(key);
    if (cell) cell.push(b); else cells.set(key, [b]);
  }
  return { cells };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 0–100: how much this buy looks like the subject. */
export function smartMatchScore(
  subject: ArvSubject,
  buy: InvestorBuyRecord,
  miles: number,
  opts: { radiusMiles: number; months: number },
  now: number,
): number {
  let score = 30 * clamp01(1 - miles / opts.radiusMiles);
  if (subject.sqft) score += 25 * clamp01(1 - Math.abs(buy.sqft - subject.sqft) / (subject.sqft * 0.25));
  if (subject.beds != null && buy.beds != null) {
    const d = Math.abs(buy.beds - subject.beds);
    score += d === 0 ? 15 : d === 1 ? 7 : 0;
  }
  if (subject.yearBuilt != null && buy.yearBuilt != null) score += 10 * clamp01(1 - Math.abs(buy.yearBuilt - subject.yearBuilt) / 20);
  const subKey = subdivisionKey(subject.subdivision);
  if (subKey && buy.subdivision === subKey) score += 10;
  score += 10 * clamp01(1 - (now - buy.soldAt) / (opts.months * MONTH_MS));
  return Math.round(score);
}

export type InvestorBuy = {
  id: string;
  address: string;
  city: string;
  buyPrice: number;
  buyDate: string;
  sqft: number;
  beds: number | null;
  baths: number | null;
  distanceMiles: number;
  kind: InvestorKind;
  score: number;
  smartMatch: boolean;
  exit: { price: number | null; date: string; status: string } | null;
  rent: number | null;
};

export type InvestorPrice = { price: number | null; pctArv: number | null; count: number };

export type InvestorCompsResponse = {
  flipper: InvestorPrice;
  landlord: InvestorPrice;
  buys: InvestorBuy[];
  /** Set when the subject can't be comped. */
  missing?: "location" | "sqft";
};

const EMPTY: InvestorPrice = { price: null, pctArv: null, count: 0 };

export function findInvestorComps(
  subject: ArvSubject,
  index: InvestorIndex,
  opts: { radiusMiles: number; months: number; arv: number | null },
  now: number = Date.now(),
): InvestorCompsResponse {
  if (subject.latitude == null || subject.longitude == null) return { flipper: EMPTY, landlord: EMPTY, buys: [], missing: "location" };
  if (!subject.sqft) return { flipper: EMPTY, landlord: EMPTY, buys: [], missing: "sqft" };
  const lat = subject.latitude, lng = subject.longitude, sqft = subject.sqft;

  const subKey = subdivisionKey(subject.subdivision);
  const attached = ATTACHED_CLASSES.includes(subject.dwellingType);
  const since = now - opts.months * MONTH_MS;
  const span = Math.ceil(opts.radiusMiles / 69 / CELL) + 1;
  const cx = Math.floor(lat / CELL), cy = Math.floor(lng / CELL);

  const hits: { buy: InvestorBuyRecord; miles: number; score: number }[] = [];
  for (let dx = -span; dx <= span; dx++) {
    for (let dy = -span; dy <= span; dy++) {
      for (const b of index.cells.get(cellKey(cx + dx, cy + dy)) ?? []) {
        if (b.propertyId === subject.id || b.dwelling !== subject.dwellingType || b.soldAt < since) continue;
        const miles = milesBetween(lat, lng, b.lat, b.lng);
        if (miles > opts.radiusMiles) continue;
        if (attached && miles > ATTACHED_MAX_MILES && !(subKey && b.subdivision === subKey)) continue;
        hits.push({ buy: b, miles, score: smartMatchScore(subject, b, miles, opts, now) });
      }
    }
  }
  hits.sort((a, b) => b.score - a.score || a.miles - b.miles);

  const priceOf = (kind: InvestorKind): InvestorPrice => {
    const ofKind = hits.filter((h) => h.buy.kind === kind);
    if (ofKind.length < MIN_PRICED_BUYS) return { price: null, pctArv: null, count: ofKind.length };
    const ppsf = percentile(ofKind.slice(0, PRICE_TOP_N).map((h) => h.buy.price / h.buy.sqft), 0.5)!;
    const price = Math.round(ppsf * sqft);
    return { price, pctArv: opts.arv ? Math.round((price / opts.arv) * 100) : null, count: ofKind.length };
  };

  const buys: InvestorBuy[] = hits.slice(0, MAX_BUYS).map(({ buy: b, miles, score }, i) => ({
    id: b.id,
    address: b.address,
    city: b.city,
    buyPrice: b.price,
    buyDate: new Date(b.soldAt).toISOString(),
    sqft: b.sqft,
    beds: b.beds,
    baths: b.baths,
    distanceMiles: Math.round(miles * 100) / 100,
    kind: b.kind,
    score,
    smartMatch: i < SMART_MATCH_TOP_N && score >= SMART_MATCH_MIN_SCORE,
    exit: b.exit && { price: b.exit.price, date: new Date(b.exit.at).toISOString(), status: b.exit.status },
    rent: b.rent,
  }));

  return { flipper: priceOf("Flipper"), landlord: priceOf("Landlord"), buys };
}
