import { prisma } from "@/lib/prisma";
import { InvestorBaseError, investorBasePost, isInvestorBaseConfigured, type IbBuyer } from "@/lib/integrations/investorbase";
import type { ListingRecord } from "./types";
import { ibCacheKey, ibPropertyTypes } from "./buyer-pay-load";
import { loadRowsByIds } from "./load";

const ENDPOINT = "/v1/buyer-search";

/**
 * Buyer Search spends from the 25/month pool shared with the InvestorBase app,
 * so it only runs when Steven clicks "Load buyers". Results never expire here:
 * re-searching an address InvestorBase already skiptraced is free there anyway.
 */
export function buyerSearchBody(row: Pick<ListingRecord, "address" | "city" | "state" | "zip" | "dwellingType">) {
  return {
    address: `${row.address}, ${row.city}, ${row.state || "AZ"} ${row.zip}`.trim(),
    property_types: ibPropertyTypes(row.dwellingType),
    radius_miles: 2,
    lookback_years: 2,
    create_deal: false,
  };
}

export type BuyersResponse =
  | { ok: true; buyers: IbBuyer[] | null; remaining: number | null; fetchedAt: string | null }
  | { ok: false; reason: "not-configured" | "not-found" | "limit" | "error"; message: string };

async function remainingThisMonth() {
  const last = await prisma.investorBaseCache.findFirst({ where: { endpoint: ENDPOINT, monthlyRemaining: { not: null } }, orderBy: { fetchedAt: "desc" }, select: { monthlyRemaining: true, fetchedAt: true } });
  const now = new Date();
  return last && last.fetchedAt.getUTCMonth() === now.getUTCMonth() && last.fetchedAt.getUTCFullYear() === now.getUTCFullYear() ? last.monthlyRemaining : null;
}

/** spend=false only reads what's saved; spend=true runs the search if nothing is saved. */
export async function loadBuyers(id: string, spend: boolean): Promise<BuyersResponse | null> {
  const [row] = await loadRowsByIds([id]);
  if (!row) return null;
  if (!isInvestorBaseConfigured()) return { ok: false, reason: "not-configured", message: "InvestorBase isn't connected" };
  const body = buyerSearchBody(row);
  const cacheKey = ibCacheKey(ENDPOINT, body);
  const hit = await prisma.investorBaseCache.findUnique({ where: { cacheKey } });
  if (hit) return { ok: true, buyers: hit.response as IbBuyer[], remaining: await remainingThisMonth(), fetchedAt: hit.fetchedAt.toISOString() };
  if (!spend) return { ok: true, buyers: null, remaining: await remainingThisMonth(), fetchedAt: null };
  try {
    const fresh = await investorBasePost<IbBuyer[]>(ENDPOINT, body);
    const data = { endpoint: ENDPOINT, response: fresh.data as object, monthlyRemaining: fresh.monthlyRemaining, fetchedAt: new Date() };
    await prisma.investorBaseCache.upsert({ where: { cacheKey }, create: { cacheKey, ...data }, update: data });
    return { ok: true, buyers: fresh.data, remaining: fresh.monthlyRemaining, fetchedAt: data.fetchedAt.toISOString() };
  } catch (err) {
    if (err instanceof InvestorBaseError && err.limitReached) return { ok: false, reason: "limit", message: "Buyer searches used up this month" };
    if (err instanceof InvestorBaseError && err.status === 404) return { ok: false, reason: "not-found", message: "InvestorBase couldn't find this address" };
    console.error("[buyers] InvestorBase failed:", err);
    return { ok: false, reason: "error", message: "InvestorBase didn't respond" };
  }
}
