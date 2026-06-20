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
