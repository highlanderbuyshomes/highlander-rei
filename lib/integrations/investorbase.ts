/**
 * InvestorBase property-data API (https://www.investorbase.com/api-docs).
 * Subscriber key in INVESTORBASE_API_KEY (Vercel env; never in code — this
 * repo is public). Limits: 20 req/min; 100/month each for investor comps,
 * analytics search and analytics summary. Callers cache (see buyer-pay-load).
 */
const BASE_URL = "https://api.investorbase.com";

export type IbPropertyType = "SFR" | "MFR" | "CONDO" | "MOBILE" | "LAND" | "OTHER";

export type IbInvestorBuy = {
  buyer_type: "flipper" | "landlord";
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  livingsquarefeet: number | null;
  lotsquarefeet: number | null;
  propertytype: string | null;
  latitude: number | null;
  longitude: number | null;
  miles_from_subject: number;
  flip_purchase_transaction_date: string | null;
  flip_purchase_transaction_price: number | null;
  flip_sale_transaction_date: string | null;
  flip_sale_transaction_price: number | null;
  rental_purchase_transaction_date: string | null;
  rental_purchase_transaction_price: number | null;
  pricePerSqFt?: number;
  rank?: number;
};

type Metrics = { count: number; price_avg: number; price_low: number; price_high: number; ppsft_avg: number; ppsft_low: number; ppsft_high: number };
export type IbSummary = {
  radius_counts: Record<"1mi" | "2mi" | "5mi" | "10mi", { flips: number; rentals: number }>;
  flipper_metrics: Metrics & { arv_pct_avg: number; arv_pct_low: number; arv_pct_high: number };
  landlord_metrics: Metrics & { aggressive_purchase_count: number; moderate_purchase_count: number; conservative_purchase_count: number };
};

export class InvestorBaseError extends Error {
  constructor(message: string, readonly status: number, readonly limitReached: boolean) { super(message); }
}

export const isInvestorBaseConfigured = () => Boolean(process.env.INVESTORBASE_API_KEY);

/** POSTs to an InvestorBase endpoint; returns the body and the monthly calls left. */
export async function investorBasePost<T>(path: string, body: unknown): Promise<{ data: T; monthlyRemaining: number | null }> {
  const key = process.env.INVESTORBASE_API_KEY;
  if (!key) throw new InvestorBaseError("INVESTORBASE_API_KEY is not set", 0, false);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new InvestorBaseError(`InvestorBase ${path} ${res.status}: ${text.slice(0, 200)}`, res.status, res.status === 429);
  }
  const remaining = res.headers.get("x-monthly-remaining");
  return { data: (await res.json()) as T, monthlyRemaining: remaining == null ? null : Number(remaining) };
}
