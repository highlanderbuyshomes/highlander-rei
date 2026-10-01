import { prisma } from "@/lib/prisma";
import { InvestorBaseError, investorBasePost, isInvestorBaseConfigured, type IbInvestorBuy, type IbPropertyType, type IbSummary } from "@/lib/integrations/investorbase";
import { whatBuyersPay, type BuyerPay } from "./buyer-pay";
import { estimateArv } from "./comps";
import { loadRowsByIds } from "./load";
import { loadCompIndex } from "./load-comps";

/** A property's InvestorBase answers are reused this long before re-fetching. */
export const CACHE_DAYS = 30;
const LOOKBACK_MONTHS = 24;
const METRICS_RADIUS_MI = 2;

export function ibPropertyTypes(dwelling: string): IbPropertyType[] {
  switch (dwelling) {
    case "Condo": return ["CONDO"];
    case "Townhouse": case "Patio Home": return ["SFR", "CONDO"];
    case "Manufactured": return ["MOBILE"];
    case "Multi-Family": return ["MFR"];
    default: return ["SFR"];
  }
}

/** Same request → same key: sorted fields, coordinates to 5 decimals (~1 m). */
export function ibCacheKey(endpoint: string, body: Record<string, unknown>): string {
  const norm = Object.keys(body).sort().map((k) => {
    const v = body[k];
    return [k, (k === "latitude" || k === "longitude") && typeof v === "number" ? v.toFixed(5) : v];
  });
  return `${endpoint} ${JSON.stringify(norm)}`;
}

async function cached<T>(endpoint: string, body: Record<string, unknown>): Promise<{ data: T; monthlyRemaining: number | null }> {
  const cacheKey = ibCacheKey(endpoint, body);
  const hit = await prisma.investorBaseCache.findUnique({ where: { cacheKey } });
  if (hit && Date.now() - hit.fetchedAt.getTime() < CACHE_DAYS * 864e5) return { data: hit.response as T, monthlyRemaining: null };
  const fresh = await investorBasePost<T>(endpoint, body);
  const data = { endpoint, response: fresh.data as object, monthlyRemaining: fresh.monthlyRemaining, fetchedAt: new Date() };
  await prisma.investorBaseCache.upsert({ where: { cacheKey }, create: { cacheKey, ...data }, update: data });
  return fresh;
}

/** Calls left this month per endpoint, from the most recent live response. */
async function monthlyRemaining() {
  const latest = (endpoint: string) => prisma.investorBaseCache.findFirst({ where: { endpoint, monthlyRemaining: { not: null } }, orderBy: { fetchedAt: "desc" }, select: { monthlyRemaining: true, fetchedAt: true } });
  const [comps, summary, search] = await Promise.all(["/v1/investor-comps", "/v1/analytics-summary", "/v1/analytics-search"].map(latest));
  // A count from an earlier month no longer applies once the month resets.
  const thisMonth = (r: { monthlyRemaining: number | null; fetchedAt: Date } | null) => r && r.fetchedAt.getUTCMonth() === new Date().getUTCMonth() && r.fetchedAt.getUTCFullYear() === new Date().getUTCFullYear() ? r.monthlyRemaining : null;
  return { investorComps: thisMonth(comps), summary: thisMonth(summary), search: thisMonth(search) };
}

export type BuyerPayResponse =
  | { ok: true; pay: BuyerPay; ranked: IbInvestorBuy[]; map: IbInvestorBuy[]; subject: { latitude: number; longitude: number }; remaining: Awaited<ReturnType<typeof monthlyRemaining>> }
  | { ok: false; reason: "not-configured" | "no-location" | "limit" | "error"; message: string };

/** What investors would pay for one listing, from InvestorBase (cached per property). */
export async function loadBuyerPay(id: string): Promise<BuyerPayResponse | null> {
  const [row] = await loadRowsByIds([id]);
  if (!row) return null;
  if (!isInvestorBaseConfigured()) return { ok: false, reason: "not-configured", message: "InvestorBase isn't connected" };
  if (row.latitude == null || row.longitude == null) return { ok: false, reason: "no-location", message: "No location" };
  const at = { latitude: row.latitude, longitude: row.longitude, property_types: ibPropertyTypes(row.dwellingType) };
  try {
    const [comps, summary, search, index] = await Promise.all([
      cached<IbInvestorBuy[]>("/v1/investor-comps", { ...at, subject_property_details: { bedrooms: row.beds, bathrooms: row.baths, square_feet: row.sqft, year_built: row.yearBuilt } }),
      cached<IbSummary>("/v1/analytics-summary", { ...at, lookback_months: LOOKBACK_MONTHS, metrics_radius_mi: METRICS_RADIUS_MI }),
      cached<IbInvestorBuy[]>("/v1/analytics-search", at),
      loadCompIndex(),
    ]);
    const arv = estimateArv(row, index)?.arv ?? null;
    return {
      ok: true, pay: whatBuyersPay(summary.data, arv, row.sqft), ranked: comps.data, map: search.data,
      subject: { latitude: row.latitude, longitude: row.longitude }, remaining: await monthlyRemaining(),
    };
  } catch (err) {
    if (err instanceof InvestorBaseError && err.limitReached) return { ok: false, reason: "limit", message: "InvestorBase monthly limit reached" };
    console.error("[buyer-pay] InvestorBase failed:", err);
    return { ok: false, reason: "error", message: "InvestorBase didn't respond" };
  }
}
