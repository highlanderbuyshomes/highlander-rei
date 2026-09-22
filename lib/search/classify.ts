import { Prisma } from "@prisma/client";

/**
 * One source of truth for turning raw MLS text into the buckets the Search UI
 * filters on. Each rule list is used twice: by the TS helpers (display, tests)
 * and to generate the SQL CASE used for server-side filtering, so the two can
 * never disagree. Rules are checked in order; the first match wins.
 */
type Rule = { label: string; any: string[] };

// RESO StandardStatus values: Active, Active Under Contract, Coming Soon,
// Pending, Closed, Expired, Canceled, Withdrawn, Hold, Delete, Incomplete.
// "ucb"/"ccbs" are ARMLS's legacy MlsStatus codes for under-contract listings.
// Under Contract must be tested before Active ("Active Under Contract").
const STATUS_RULES: Rule[] = [
  { label: "Coming Soon", any: ["coming"] },
  { label: "Under Contract", any: ["under contract", "ucb", "ccbs"] },
  { label: "Active", any: ["active"] },
  { label: "Pending", any: ["pending", "contract"] },
  { label: "Expired", any: ["expire"] },
  { label: "Canceled", any: ["cancel", "withdraw", "hold"] },
  { label: "Closed", any: ["closed", "sold"] },
  { label: "Deleted", any: ["delete", "incomplete"] },
];

// PropertySubType/PropertyType text -> the Dwelling Type checkboxes. ARMLS
// sends e.g. "Single Family Residence", "Condominium", "Gemini/Twin Home".
// Specific kinds are tested before the generic "residence"/"residential".
const DWELLING_RULES: Rule[] = [
  { label: "Townhouse", any: ["townho"] },
  { label: "Condo", any: ["condo", "apartment", "loft"] },
  { label: "Patio Home", any: ["patio", "gemini", "twin"] },
  { label: "Manufactured", any: ["manufactured", "mobile", "modular"] },
  { label: "Multi-Family", any: ["duplex", "triplex", "fourplex", "quad", "multi", "income", "mfh"] },
  { label: "Land", any: ["land", "lots"] },
  { label: "Commercial", any: ["commercial", "comm/", "industr", "business", "office", "retail"] },
  { label: "Single Family", any: ["single", "residence", "residential", "detached", "sfr"] },
];

/** Dwelling classes an ARV can be modeled for (land/commercial comps are too sparse and heterogeneous). */
export const RESIDENTIAL_CLASSES = ["Single Family", "Townhouse", "Condo", "Patio Home", "Manufactured", "Multi-Family"];

function classify(rules: Rule[], value: string | null | undefined, fallback: string) {
  const text = (value ?? "").toLowerCase();
  if (!text) return fallback;
  return rules.find((r) => r.any.some((needle) => text.includes(needle)))?.label ?? fallback;
}

export function normalizeStatus(value: string | null | undefined) {
  return classify(STATUS_RULES, value, value || "Off Market");
}

export function normalizeDwelling(value: string | null | undefined) {
  return classify(DWELLING_RULES, value, value ? "Other" : "Single Family");
}

// Needles are plain lowercase words (no quotes/wildcards), so inlining them is safe.
function caseSql(rules: Rule[], expr: string, fallbackSql: string) {
  const text = `lower(COALESCE(${expr}, ''))`;
  const arms = rules.map((r) => `WHEN ${r.any.map((n) => `${text} LIKE '%${n}%'`).join(" OR ")} THEN '${r.label}'`);
  return `CASE ${arms.join(" ")} ELSE ${fallbackSql} END`;
}

export const statusSql = (expr: string) => Prisma.raw(caseSql(STATUS_RULES, expr, `COALESCE(NULLIF(${expr}, ''), 'Off Market')`));
export const dwellingSql = (expr: string) => Prisma.raw(caseSql(DWELLING_RULES, expr, `CASE WHEN NULLIF(${expr}, '') IS NULL THEN 'Single Family' ELSE 'Other' END`));
