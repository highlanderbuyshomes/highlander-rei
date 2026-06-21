/**
 * Buy-box matching engine.
 *
 * Pure functions — no database calls, no side effects.
 * Feed in a property and a buy box, get back a scored result
 * with per-field explanations.
 */

export interface MatchableProperty {
  zip?: string | null;
  subdivision?: string | null;
  propertyType?: string | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  lotSqft?: number | null;
  yearBuilt?: number | null;
  estimatedValue?: number | null;
  lastSalePrice?: number | null;
  lastSaleDate?: Date | string | null;
  listPrice?: number | null;
  mlsStatus?: string | null;
  dom?: number | null;
  ownerOccupied?: boolean | null;
  ownershipStartDate?: Date | string | null;
  estimatedEquityPct?: number | null;
}

export interface MatchableBuyBox {
  zips?: string[];
  subdivisions?: string[];
  propertyTypes?: string[];
  priceMin?: number | null;
  priceMax?: number | null;
  bedsMin?: number | null;
  bedsMax?: number | null;
  bathsMin?: number | null;
  bathsMax?: number | null;
  sqftMin?: number | null;
  sqftMax?: number | null;
  lotSqftMin?: number | null;
  lotSqftMax?: number | null;
  yearBuiltMin?: number | null;
  yearBuiltMax?: number | null;
  ownershipDurationMin?: number | null;
  minEquityPct?: number | null;
  ownerOccupied?: string | null;
  mlsStatuses?: string[];
  maxDom?: number | null;
}

export interface CriterionResult {
  field: string;
  passed: boolean;
  required: boolean;
  detail: string;
}

export interface MatchResult {
  matched: boolean;
  score: number;
  totalCriteria: number;
  passedCriteria: number;
  failedRequired: number;
  reasons: CriterionResult[];
}

function arrFromJson(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  return [];
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function toDate(val: Date | string | null | undefined): Date | null {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

export function matchPropertyToBuyBox(
  property: MatchableProperty,
  buyBox: MatchableBuyBox,
): MatchResult {
  const reasons: CriterionResult[] = [];
  const zips = arrFromJson(buyBox.zips);
  const subdivisions = arrFromJson(buyBox.subdivisions);
  const propertyTypes = arrFromJson(buyBox.propertyTypes);
  const mlsStatuses = arrFromJson(buyBox.mlsStatuses);

  // ── Location checks (required when specified) ────────────────────

  if (zips.length > 0) {
    const passed = !!property.zip && zips.includes(property.zip);
    reasons.push({
      field: "zip",
      passed,
      required: true,
      detail: passed
        ? `ZIP ${property.zip} is in target list`
        : `ZIP ${property.zip ?? "unknown"} not in [${zips.join(", ")}]`,
    });
  }

  if (subdivisions.length > 0) {
    const norm = (s: string) => s.toLowerCase().trim();
    const passed = !!property.subdivision && subdivisions.some((s) => norm(s) === norm(property.subdivision!));
    reasons.push({
      field: "subdivision",
      passed,
      required: false,
      detail: passed
        ? `Subdivision "${property.subdivision}" matches`
        : `Subdivision "${property.subdivision ?? "unknown"}" not in target list`,
    });
  }

  // ── Property type ────────────────────────────────────────────────

  if (propertyTypes.length > 0) {
    const norm = (s: string) => s.toLowerCase().trim();
    const passed = !!property.propertyType && propertyTypes.some((t) => norm(t) === norm(property.propertyType!));
    reasons.push({
      field: "propertyType",
      passed,
      required: true,
      detail: passed
        ? `Type "${property.propertyType}" matches`
        : `Type "${property.propertyType ?? "unknown"}" not in [${propertyTypes.join(", ")}]`,
    });
  }

  // ── Price range ──────────────────────────────────────────────────

  const price = property.listPrice ?? property.estimatedValue;
  if (buyBox.priceMin != null || buyBox.priceMax != null) {
    if (price == null) {
      reasons.push({ field: "price", passed: false, required: true, detail: "No price available" });
    } else {
      const aboveMin = buyBox.priceMin == null || price >= buyBox.priceMin;
      const belowMax = buyBox.priceMax == null || price <= buyBox.priceMax;
      const passed = aboveMin && belowMax;
      const rangeStr = buyBox.priceMin != null && buyBox.priceMax != null
        ? `$${fmt(buyBox.priceMin)}–$${fmt(buyBox.priceMax)}`
        : buyBox.priceMin != null ? `≥ $${fmt(buyBox.priceMin)}` : `≤ $${fmt(buyBox.priceMax!)}`;
      reasons.push({
        field: "price",
        passed,
        required: true,
        detail: passed
          ? `$${fmt(price)} within ${rangeStr}`
          : `$${fmt(price)} outside ${rangeStr}`,
      });
    }
  }

  // ── Beds ─────────────────────────────────────────────────────────

  if (buyBox.bedsMin != null || buyBox.bedsMax != null) {
    if (property.beds == null) {
      reasons.push({ field: "beds", passed: false, required: true, detail: "Bed count unknown" });
    } else {
      const aboveMin = buyBox.bedsMin == null || property.beds >= buyBox.bedsMin;
      const belowMax = buyBox.bedsMax == null || property.beds <= buyBox.bedsMax;
      const passed = aboveMin && belowMax;
      reasons.push({
        field: "beds",
        passed,
        required: true,
        detail: passed
          ? `${property.beds} beds meets criteria`
          : `${property.beds} beds outside range (${buyBox.bedsMin ?? "any"}–${buyBox.bedsMax ?? "any"})`,
      });
    }
  }

  // ── Baths ────────────────────────────────────────────────────────

  if (buyBox.bathsMin != null || buyBox.bathsMax != null) {
    if (property.baths == null) {
      reasons.push({ field: "baths", passed: false, required: false, detail: "Bath count unknown" });
    } else {
      const aboveMin = buyBox.bathsMin == null || property.baths >= buyBox.bathsMin;
      const belowMax = buyBox.bathsMax == null || property.baths <= buyBox.bathsMax;
      const passed = aboveMin && belowMax;
      reasons.push({
        field: "baths",
        passed,
        required: false,
        detail: passed
          ? `${property.baths} baths meets criteria`
          : `${property.baths} baths outside range (${buyBox.bathsMin ?? "any"}–${buyBox.bathsMax ?? "any"})`,
      });
    }
  }

  // ── Sqft ─────────────────────────────────────────────────────────

  if (buyBox.sqftMin != null || buyBox.sqftMax != null) {
    if (property.sqft == null) {
      reasons.push({ field: "sqft", passed: false, required: true, detail: "Square footage unknown" });
    } else {
      const aboveMin = buyBox.sqftMin == null || property.sqft >= buyBox.sqftMin;
      const belowMax = buyBox.sqftMax == null || property.sqft <= buyBox.sqftMax;
      const passed = aboveMin && belowMax;
      reasons.push({
        field: "sqft",
        passed,
        required: true,
        detail: passed
          ? `${fmt(property.sqft)} sqft meets criteria`
          : `${fmt(property.sqft)} sqft outside range (${fmt(buyBox.sqftMin ?? 0)}–${buyBox.sqftMax ? fmt(buyBox.sqftMax) : "any"})`,
      });
    }
  }

  // ── Lot size ─────────────────────────────────────────────────────

  if (buyBox.lotSqftMin != null || buyBox.lotSqftMax != null) {
    if (property.lotSqft == null) {
      reasons.push({ field: "lotSqft", passed: false, required: false, detail: "Lot size unknown" });
    } else {
      const aboveMin = buyBox.lotSqftMin == null || property.lotSqft >= buyBox.lotSqftMin;
      const belowMax = buyBox.lotSqftMax == null || property.lotSqft <= buyBox.lotSqftMax;
      const passed = aboveMin && belowMax;
      reasons.push({
        field: "lotSqft",
        passed,
        required: false,
        detail: passed
          ? `${fmt(property.lotSqft)} sqft lot meets criteria`
          : `${fmt(property.lotSqft)} sqft lot outside range`,
      });
    }
  }

  // ── Year built ───────────────────────────────────────────────────

  if (buyBox.yearBuiltMin != null || buyBox.yearBuiltMax != null) {
    if (property.yearBuilt == null) {
      reasons.push({ field: "yearBuilt", passed: false, required: false, detail: "Year built unknown" });
    } else {
      const aboveMin = buyBox.yearBuiltMin == null || property.yearBuilt >= buyBox.yearBuiltMin;
      const belowMax = buyBox.yearBuiltMax == null || property.yearBuilt <= buyBox.yearBuiltMax;
      const passed = aboveMin && belowMax;
      reasons.push({
        field: "yearBuilt",
        passed,
        required: false,
        detail: passed
          ? `Built ${property.yearBuilt} meets criteria`
          : `Built ${property.yearBuilt} outside range (${buyBox.yearBuiltMin ?? "any"}–${buyBox.yearBuiltMax ?? "any"})`,
      });
    }
  }

  // ── Ownership duration ───────────────────────────────────────────

  if (buyBox.ownershipDurationMin != null) {
    const start = toDate(property.ownershipStartDate);
    if (!start) {
      reasons.push({ field: "ownershipDuration", passed: false, required: false, detail: "Ownership start unknown" });
    } else {
      const months = monthsBetween(start, new Date());
      const passed = months >= buyBox.ownershipDurationMin;
      reasons.push({
        field: "ownershipDuration",
        passed,
        required: false,
        detail: passed
          ? `Owned ${months} months (min ${buyBox.ownershipDurationMin})`
          : `Owned only ${months} months (need ${buyBox.ownershipDurationMin})`,
      });
    }
  }

  // ── Equity ───────────────────────────────────────────────────────

  if (buyBox.minEquityPct != null) {
    if (property.estimatedEquityPct == null) {
      reasons.push({ field: "equity", passed: false, required: false, detail: "Equity percentage unknown" });
    } else {
      const passed = property.estimatedEquityPct >= buyBox.minEquityPct;
      reasons.push({
        field: "equity",
        passed,
        required: false,
        detail: passed
          ? `${property.estimatedEquityPct.toFixed(1)}% equity (min ${buyBox.minEquityPct}%)`
          : `${property.estimatedEquityPct.toFixed(1)}% equity below ${buyBox.minEquityPct}% minimum`,
      });
    }
  }

  // ── Owner occupancy ──────────────────────────────────────────────

  if (buyBox.ownerOccupied && buyBox.ownerOccupied !== "any") {
    if (property.ownerOccupied == null) {
      reasons.push({ field: "ownerOccupied", passed: false, required: false, detail: "Occupancy status unknown" });
    } else {
      const wantOccupied = buyBox.ownerOccupied === "owner";
      const passed = property.ownerOccupied === wantOccupied;
      reasons.push({
        field: "ownerOccupied",
        passed,
        required: false,
        detail: passed
          ? `${property.ownerOccupied ? "Owner-occupied" : "Absentee"} matches preference`
          : `${property.ownerOccupied ? "Owner-occupied" : "Absentee"} — want ${buyBox.ownerOccupied}`,
      });
    }
  }

  // ── MLS status ───────────────────────────────────────────────────

  if (mlsStatuses.length > 0) {
    const norm = (s: string) => s.toLowerCase().trim();
    if (!property.mlsStatus) {
      reasons.push({ field: "mlsStatus", passed: true, required: false, detail: "No MLS status (off-market)" });
    } else {
      const passed = mlsStatuses.some((s) => norm(s) === norm(property.mlsStatus!));
      reasons.push({
        field: "mlsStatus",
        passed,
        required: false,
        detail: passed
          ? `Status "${property.mlsStatus}" is in target list`
          : `Status "${property.mlsStatus}" not in [${mlsStatuses.join(", ")}]`,
      });
    }
  }

  // ── Days on market ───────────────────────────────────────────────

  if (buyBox.maxDom != null) {
    if (property.dom == null) {
      reasons.push({ field: "dom", passed: true, required: false, detail: "DOM unknown (not penalized)" });
    } else {
      const passed = property.dom <= buyBox.maxDom;
      reasons.push({
        field: "dom",
        passed,
        required: false,
        detail: passed
          ? `${property.dom} DOM within ${buyBox.maxDom} max`
          : `${property.dom} DOM exceeds ${buyBox.maxDom} max`,
      });
    }
  }

  // ── Scoring ──────────────────────────────────────────────────────

  const totalCriteria = reasons.length;
  const passedCriteria = reasons.filter((r) => r.passed).length;
  const failedRequired = reasons.filter((r) => !r.passed && r.required).length;

  const matched = failedRequired === 0 && totalCriteria > 0;

  let score = 0;
  if (totalCriteria > 0) {
    score = Math.round((passedCriteria / totalCriteria) * 100);
  }

  return { matched, score, totalCriteria, passedCriteria, failedRequired, reasons };
}

// ── Weighted Scoring ─────────────────────────────────────────────

export const DEFAULT_WEIGHTS: ScoreWeights = {
  buyBoxFit: 30,
  geographicPriority: 15,
  estimatedEquity: 15,
  ownershipDuration: 10,
  absenteeStatus: 5,
  mlsStatus: 5,
  daysOnMarket: 5,
  priceReduction: 5,
  dataFreshness: 5,
  contactability: 5,
};

export interface ScoreWeights {
  buyBoxFit: number;
  geographicPriority: number;
  estimatedEquity: number;
  ownershipDuration: number;
  absenteeStatus: number;
  mlsStatus: number;
  daysOnMarket: number;
  priceReduction: number;
  dataFreshness: number;
  contactability: number;
}

export interface WeightedScoreBreakdown {
  totalScore: number;
  maxPossible: number;
  components: { name: string; weight: number; earned: number; detail: string }[];
}

export function computeWeightedScore(
  property: MatchableProperty & {
    priceReduction?: number | null;
    lastRefreshedAt?: Date | string | null;
    hasPhone?: boolean;
    hasEmail?: boolean;
    buyBoxPriority?: number;
  },
  matchResult: MatchResult,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): WeightedScoreBreakdown {
  const components: WeightedScoreBreakdown["components"] = [];
  let total = 0;

  // Buy-box fit: use the base match score
  const fitScore = (matchResult.score / 100) * weights.buyBoxFit;
  total += fitScore;
  components.push({ name: "Buy-Box Fit", weight: weights.buyBoxFit, earned: Math.round(fitScore * 10) / 10, detail: `${matchResult.passedCriteria}/${matchResult.totalCriteria} criteria passed` });

  // Geographic priority: based on buy-box priority level
  const geoPriority = property.buyBoxPriority ?? 0;
  const geoScore = Math.min(geoPriority / 5, 1) * weights.geographicPriority;
  total += geoScore;
  components.push({ name: "Geographic Priority", weight: weights.geographicPriority, earned: Math.round(geoScore * 10) / 10, detail: `Priority level ${geoPriority}` });

  // Estimated equity
  const eqPct = property.estimatedEquityPct;
  const eqScore = eqPct != null ? Math.min(eqPct / 60, 1) * weights.estimatedEquity : 0;
  total += eqScore;
  components.push({ name: "Estimated Equity", weight: weights.estimatedEquity, earned: Math.round(eqScore * 10) / 10, detail: eqPct != null ? `${eqPct.toFixed(1)}% equity` : "Unknown" });

  // Ownership duration
  const ownerStart = property.ownershipStartDate ? new Date(property.ownershipStartDate) : null;
  let ownerMonths = 0;
  if (ownerStart && !isNaN(ownerStart.getTime())) {
    ownerMonths = (Date.now() - ownerStart.getTime()) / (1000 * 60 * 60 * 24 * 30);
  }
  const ownerScore = ownerMonths > 0 ? Math.min(ownerMonths / 120, 1) * weights.ownershipDuration : 0;
  total += ownerScore;
  components.push({ name: "Ownership Duration", weight: weights.ownershipDuration, earned: Math.round(ownerScore * 10) / 10, detail: ownerMonths > 0 ? `${Math.round(ownerMonths)} months` : "Unknown" });

  // Absentee status
  const absenteeScore = property.ownerOccupied === false ? weights.absenteeStatus : 0;
  total += absenteeScore;
  components.push({ name: "Absentee Status", weight: weights.absenteeStatus, earned: absenteeScore, detail: property.ownerOccupied === false ? "Absentee owner" : property.ownerOccupied === true ? "Owner-occupied" : "Unknown" });

  // MLS status bonus (expired/withdrawn = higher motivation)
  const status = property.mlsStatus?.toLowerCase();
  const mlsScore = status && ["expired", "withdrawn", "canceled"].includes(status) ? weights.mlsStatus : status === "active" ? weights.mlsStatus * 0.3 : 0;
  total += mlsScore;
  components.push({ name: "MLS Status", weight: weights.mlsStatus, earned: Math.round(mlsScore * 10) / 10, detail: property.mlsStatus ?? "Off-market" });

  // Days on market
  const dom = property.dom;
  const domScore = dom != null ? Math.min(dom / 180, 1) * weights.daysOnMarket : 0;
  total += domScore;
  components.push({ name: "Days on Market", weight: weights.daysOnMarket, earned: Math.round(domScore * 10) / 10, detail: dom != null ? `${dom} days` : "N/A" });

  // Price reduction
  const reduction = property.priceReduction;
  const reductionScore = reduction != null && reduction > 0 ? Math.min(reduction / 10, 1) * weights.priceReduction : 0;
  total += reductionScore;
  components.push({ name: "Price Reduction", weight: weights.priceReduction, earned: Math.round(reductionScore * 10) / 10, detail: reduction != null ? `${reduction.toFixed(1)}% reduced` : "None" });

  // Data freshness
  const refreshed = property.lastRefreshedAt ? new Date(property.lastRefreshedAt) : null;
  let freshnessScore = 0;
  if (refreshed && !isNaN(refreshed.getTime())) {
    const daysOld = (Date.now() - refreshed.getTime()) / (1000 * 60 * 60 * 24);
    freshnessScore = Math.max(0, 1 - daysOld / 90) * weights.dataFreshness;
  }
  total += freshnessScore;
  components.push({ name: "Data Freshness", weight: weights.dataFreshness, earned: Math.round(freshnessScore * 10) / 10, detail: refreshed ? `Updated ${Math.round((Date.now() - refreshed.getTime()) / 86400000)}d ago` : "Never" });

  // Contactability
  const contactScore = (property.hasPhone || property.hasEmail) ? weights.contactability : 0;
  total += contactScore;
  components.push({ name: "Contactability", weight: weights.contactability, earned: contactScore, detail: property.hasPhone ? "Phone available" : property.hasEmail ? "Email only" : "No contact info" });

  const maxPossible = Object.values(weights).reduce((a, b) => a + b, 0);

  return { totalScore: Math.round(total), maxPossible, components };
}

export function matchPropertyToAllBuyBoxes(
  property: MatchableProperty,
  buyBoxes: (MatchableBuyBox & { id: string; name: string })[],
): { buyBoxId: string; buyBoxName: string; result: MatchResult }[] {
  return buyBoxes
    .map((bb) => ({
      buyBoxId: bb.id,
      buyBoxName: bb.name,
      result: matchPropertyToBuyBox(property, bb),
    }))
    .sort((a, b) => b.result.score - a.result.score);
}
