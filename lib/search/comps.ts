/**
 * Deterministic sold-comps ARV. No model, no third party. For each subject it
 * looks for nearby Closed MLS sales of the same dwelling class and similar
 * size, trying the strongest evidence first:
 *   1. Flip resales: a sale whose property was bought with cash in the prior
 *      12 months (buy at a discount, renovate, resell). Median $/sqft.
 *   2. Renovated comps: sales whose remarks say remodeled/updated/etc. Median.
 *   3. All similar sales: the upper-quartile $/sqft as a proxy for renovated
 *      value (median with few comps). Capped at Medium confidence.
 * Within each basis the radius / look-back widens in fixed tiers until enough
 * comps are found, and outlier sales are trimmed. Comp $/sqft is scaled to the
 * subject's size, and lots must be similar. Tuned against real flip resales
 * with scripts/backtest-arv.ts — re-run it before changing any of this.
 */

export type ClosedComp = {
  id: string;
  /** The sold property; search rows (and so ARV subjects) are keyed by it. */
  propertyId?: string;
  lat: number;
  lng: number;
  sqft: number;
  beds: number | null;
  yearBuilt: number | null;
  dwelling: string;
  zip: string;
  /** Normalized subdivision key (see subdivisionKey), or null. */
  subdivision: string | null;
  price: number;
  closedAt: number; // epoch ms
  address: string;
  city: string;
  /** Resold within 12 months of a cash purchase — a flip's after-repair sale. */
  flipResale?: boolean;
  /** Remarks describe a remodel/update. */
  renovated?: boolean;
  lotSqft?: number | null;
};

export type ArvBasis = "Flip resales" | "Renovated comps" | "All sales";

export type ArvSubject = {
  id: string;
  latitude: number | null;
  longitude: number | null;
  sqft: number | null;
  beds: number | null;
  yearBuilt: number | null;
  dwellingType: string;
  zip: string;
  subdivision?: string | null;
  lotSqft?: number | null;
};

export type ArvConfidence = "High" | "Medium" | "Low";

export type ArvEstimate = {
  arv: number;
  pricePerSqft: number;
  method: "Sold comps" | "ZIP sold $/sqft";
  basis: ArvBasis;
  confidence: ArvConfidence;
  compCount: number;
  radiusMiles: number | null;
  /** True when the comps all come from the subject's own subdivision/complex. */
  sameSubdivision: boolean;
  monthsBack: number;
  comps: { id: string; distanceMiles: number | null }[];
  /** ±% that 7 in 10 backtested resales fell within (see arvRangePct). */
  rangePct: number;
};

// Tiers are tried in order; the first with MIN_COMPS matches wins.
// Before any ring, sales in the subject's own subdivision/complex within
// SUBDIVISION_TIER are used — how an appraiser comps a condo or a tract home.
export const SUBDIVISION_TIER = { miles: 1, months: 12, confidence: "High" as const };
export const TIERS = [
  { miles: 0.25, months: 6, confidence: "High" as const },
  { miles: 0.5, months: 6, confidence: "High" as const },
  { miles: 1, months: 6, confidence: "High" as const },
  { miles: 1, months: 12, confidence: "Medium" as const },
  { miles: 2, months: 12, confidence: "Low" as const },
];
/** Condo/townhouse values vary by complex, so outside their own subdivision they only comp this close in. */
export const ATTACHED_CLASSES = ["Condo", "Townhouse", "Patio Home"];
export const ATTACHED_MAX_MILES = 0.5;
export const MIN_COMPS = 3;
export const MAX_COMPS = 10;
/** Upper-quartile sold $/sqft approximates renovated resale value... */
export const ARV_PERCENTILE = 0.75;
/** ...but only with this many comps; fewer use the median so one sale can't set the ARV. */
export const PERCENTILE_MIN_COMPS = 6;
/** Flip and renovated comps are already the after-repair market: radius tiers they may use. */
export const RENOVATED_TIERS = [
  { miles: 0.5, months: 12 },
  { miles: 1, months: 12 },
];
/** Keyword-renovated comps include half-updated homes; their median ran ~3% low. */
export const RENOVATED_PERCENTILE = 0.65;
/** Price ∝ sqft^(1 − SIZE_EXP): a smaller comp's $/sqft is scaled down to the subject's size. */
export const SIZE_EXP = 0.4;
/** Comps' lots must be within ±this fraction of the subject's (log scale). */
export const LOT_TOLERANCE = 0.5;
/** Smaller "lots" are condo pads or bad data, so lot size isn't compared. */
export const MIN_LOT_SQFT = 500;
/** Renovated evidence with at least this many comps is High confidence, else Medium. */
const RENOVATED_HIGH_COMPS = 5;
/** Comps further than this factor from the median $/sqft are dropped as outliers. */
const OUTLIER_FACTOR = 1.5;
const SQFT_TOLERANCE = 0.25;
const BEDS_TOLERANCE = 1;
const YEAR_TOLERANCE = 20;
const ZIP_MIN_SALES = 5;
const CELL = 0.01; // degrees ≈ 0.7 mi of latitude
const MONTH_MS = 30.44 * 24 * 3600_000;

export function percentile(values: number[], p: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function milesBetween(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(a));
}

/**
 * ±% range from the backtest on 1,205 flip resales (Sept 2026): the absolute
 * error 7 in 10 resales fell within, by estimated ARV (Low confidence: 25%).
 */
export function arvRangePct(arv: number, confidence: ArvConfidence): number {
  if (confidence === "Low") return 25;
  if (arv < 300_000) return 14;
  if (arv < 450_000) return 10;
  if (arv < 700_000) return 13;
  return 22;
}

/** Comp $/sqft scaled to the subject's size. */
function sizedPpsf(c: { price: number; sqft: number }, subjectSqft: number) {
  return (c.price / c.sqft) * Math.pow(c.sqft / subjectSqft, SIZE_EXP);
}

function trimOutliers<T>(items: T[], ppsfOf: (item: T) => number): T[] {
  const mid = percentile(items.map(ppsfOf), 0.5);
  if (mid == null) return items;
  return items.filter((item) => ppsfOf(item) <= mid * OUTLIER_FACTOR && ppsfOf(item) >= mid / OUTLIER_FACTOR);
}

function arvPpsf(values: number[]) {
  return percentile(values, values.length >= PERCENTILE_MIN_COMPS ? ARV_PERCENTILE : 0.5)!;
}

const NO_SUBDIVISION = new Set(["", "n/a", "na", "none", "no", "not applicable", "unknown", "other", "metes and bounds", "metes & bounds"]);

/** Case/space-insensitive subdivision key; placeholders like "N/A" become null. */
export function subdivisionKey(value: string | null | undefined): string | null {
  const key = (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  return NO_SUBDIVISION.has(key) ? null : key;
}

const cellKey = (x: number, y: number) => `${x},${y}`;

export type CompIndex = {
  byId: Map<string, ClosedComp>;
  cells: Map<string, ClosedComp[]>;
  zipPpsf: Map<string, { at: number; ppsf: number }[]>;
};

export function buildCompIndex(comps: ClosedComp[]): CompIndex {
  const cells = new Map<string, ClosedComp[]>();
  const zipPpsf = new Map<string, { at: number; ppsf: number }[]>();
  const byId = new Map<string, ClosedComp>();
  for (const c of comps) {
    byId.set(c.id, c);
    const key = cellKey(Math.floor(c.lat / CELL), Math.floor(c.lng / CELL));
    const cell = cells.get(key);
    if (cell) cell.push(c); else cells.set(key, [c]);
    const zk = `${c.zip}\u0000${c.dwelling}`;
    const z = zipPpsf.get(zk);
    const entry = { at: c.closedAt, ppsf: c.price / c.sqft };
    if (z) z.push(entry); else zipPpsf.set(zk, [entry]);
  }
  return { byId, cells, zipPpsf };
}

function similar(subject: ArvSubject, c: ClosedComp) {
  if (c.dwelling !== subject.dwellingType) return false;
  if (Math.abs(c.sqft - subject.sqft!) > subject.sqft! * SQFT_TOLERANCE) return false;
  if (subject.beds != null && c.beds != null && Math.abs(c.beds - subject.beds) > BEDS_TOLERANCE) return false;
  if (subject.yearBuilt != null && c.yearBuilt != null && Math.abs(c.yearBuilt - subject.yearBuilt) > YEAR_TOLERANCE) return false;
  if (subject.lotSqft && c.lotSqft && subject.lotSqft >= MIN_LOT_SQFT && c.lotSqft >= MIN_LOT_SQFT && Math.abs(Math.log(c.lotSqft / subject.lotSqft)) > Math.log(1 + LOT_TOLERANCE)) return false;
  return true;
}

export function estimateArv(subject: ArvSubject, index: CompIndex, now: number = Date.now()): ArvEstimate | null {
  if (!subject.sqft || subject.sqft < 300) return null;

  if (subject.latitude != null && subject.longitude != null) {
    const lat = subject.latitude, lng = subject.longitude;
    // Gather every similar comp inside the widest tier once, then filter per tier.
    const widest = TIERS[TIERS.length - 1];
    const span = Math.ceil(widest.miles / 69 / CELL) + 1;
    const cx = Math.floor(lat / CELL), cy = Math.floor(lng / CELL);
    const pool: { comp: ClosedComp; miles: number }[] = [];
    for (let dx = -span; dx <= span; dx++) {
      for (let dy = -span; dy <= span; dy++) {
        for (const c of index.cells.get(cellKey(cx + dx, cy + dy)) ?? []) {
          if (c.id === subject.id || c.propertyId === subject.id || !similar(subject, c)) continue;
          const miles = milesBetween(lat, lng, c.lat, c.lng);
          if (miles <= widest.miles) pool.push({ comp: c, miles });
        }
      }
    }
    const subKey = subdivisionKey(subject.subdivision);
    const attached = ATTACHED_CLASSES.includes(subject.dwellingType);
    const withinTier = (p: { comp: ClosedComp; miles: number }, miles: number, months: number, sameSubdivision: boolean) =>
      p.miles <= miles && p.comp.closedAt >= now - months * MONTH_MS && (!sameSubdivision || p.comp.subdivision === subKey);
    const sized = (h: { comp: ClosedComp }) => sizedPpsf(h.comp, subject.sqft!);
    const result = (hits: { comp: ClosedComp; miles: number }[], ppsf: number, basis: ArvBasis, confidence: ArvConfidence, tier: { miles: number; months: number; sameSubdivision: boolean }): ArvEstimate => ({
      arv: Math.round(ppsf * subject.sqft!),
      rangePct: arvRangePct(ppsf * subject.sqft!, confidence),
      pricePerSqft: ppsf,
      method: "Sold comps",
      basis,
      confidence,
      compCount: hits.length,
      radiusMiles: tier.miles,
      sameSubdivision: tier.sameSubdivision,
      monthsBack: tier.months,
      comps: hits.map((h) => ({ id: h.comp.id, distanceMiles: Math.round(h.miles * 100) / 100 })),
    });

    // 1-2. Flip resales, then renovated comps: already the after-repair market, so the median.
    const renovatedTiers = [
      ...(subKey ? [{ ...SUBDIVISION_TIER, sameSubdivision: true }] : []),
      ...RENOVATED_TIERS.map((t) => ({ ...t, sameSubdivision: false })).filter((t) => !attached || t.miles <= ATTACHED_MAX_MILES),
    ];
    const evidence: [ArvBasis, (c: ClosedComp) => boolean][] = [
      ["Flip resales", (c) => c.flipResale === true],
      ["Renovated comps", (c) => c.flipResale === true || c.renovated === true],
    ];
    for (const [basis, qualifies] of evidence) {
      for (const tier of renovatedTiers) {
        const nearest = pool.filter((p) => qualifies(p.comp) && withinTier(p, tier.miles, tier.months, tier.sameSubdivision))
          .sort((a, b) => a.miles - b.miles).slice(0, MAX_COMPS);
        const hits = trimOutliers(nearest, sized);
        if (hits.length < MIN_COMPS) continue;
        const ppsf = percentile(hits.map(sized), basis === "Flip resales" ? 0.5 : RENOVATED_PERCENTILE)!;
        return result(hits, ppsf, basis, hits.length >= RENOVATED_HIGH_COMPS ? "High" : "Medium", tier);
      }
    }

    // 3. All similar sales, priced at the upper quartile as a stand-in for renovated value.
    const tiers = [
      ...(subKey ? [{ ...SUBDIVISION_TIER, sameSubdivision: true }] : []),
      ...TIERS.map((t) => ({ ...t, sameSubdivision: false })).filter((t) => !attached || t.miles <= ATTACHED_MAX_MILES),
    ];
    for (const tier of tiers) {
      const nearest = pool.filter((p) => withinTier(p, tier.miles, tier.months, tier.sameSubdivision))
        .sort((a, b) => a.miles - b.miles).slice(0, MAX_COMPS);
      const hits = trimOutliers(nearest, sized);
      if (hits.length < MIN_COMPS) continue;
      const ppsf = arvPpsf(hits.map(sized));
      // A guess at renovated value is never High.
      const confidence: ArvConfidence = tier.confidence === "Low" ? "Low" : "Medium";
      return result(hits, ppsf, "All sales", confidence, tier);
    }
  }

  // No usable neighborhood: fall back to the ZIP's sold $/sqft for the class.
  const since = now - 12 * MONTH_MS;
  const zipSales = (index.zipPpsf.get(`${subject.zip}\u0000${subject.dwellingType}`) ?? []).filter((z) => z.at >= since);
  if (zipSales.length < ZIP_MIN_SALES) return null;
  const ppsf = arvPpsf(trimOutliers(zipSales, (z) => z.ppsf).map((z) => z.ppsf));
  return {
    arv: Math.round(ppsf * subject.sqft),
    pricePerSqft: ppsf,
    method: "ZIP sold $/sqft",
    basis: "All sales",
    confidence: "Low",
    rangePct: arvRangePct(ppsf * subject.sqft, "Low"),
    compCount: zipSales.length,
    radiusMiles: null,
    sameSubdivision: false,
    monthsBack: 12,
    comps: [],
  };
}
