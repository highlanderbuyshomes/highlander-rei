import type { IbSummary } from "@/lib/integrations/investorbase";

export type FlipperPay = { low: number; high: number; pctLow: number; pctHigh: number; priceLow: number; priceHigh: number; ppsfLow: number; ppsfHigh: number; count: number };
export type LandlordPay = { low: number; high: number; ppsfLow: number; ppsfHigh: number; priceLow: number; priceHigh: number; count: number; aggressive: number; moderate: number; conservative: number };
export type BuyerPay = { flipper: FlipperPay | null; landlord: LandlordPay | null; activity: { miles: number; flips: number; rentals: number }[] };

/**
 * What investors would pay for the subject, from InvestorBase's area summary.
 * Flippers: the 33rd–67th percentile % of resale they pay here, applied to our
 * ARV. Landlords: their 33rd–67th percentile $/sqft on the subject's size
 * (their mean is skewed by outliers). Without ARV or sqft, the area's price
 * range stands in.
 */
export function whatBuyersPay(summary: IbSummary, arv: number | null, sqft: number | null): BuyerPay {
  const f = summary.flipper_metrics, l = summary.landlord_metrics;
  const [pctLow, pctHigh] = [f.arv_pct_low, f.arv_pct_high].sort((a, b) => a - b);
  const flipper: FlipperPay | null = f.count > 0 ? {
    low: arv ? Math.round(arv * pctLow / 100) : f.price_low,
    high: arv ? Math.round(arv * pctHigh / 100) : f.price_high,
    pctLow, pctHigh, priceLow: f.price_low, priceHigh: f.price_high, ppsfLow: f.ppsft_low, ppsfHigh: f.ppsft_high, count: f.count,
  } : null;
  const landlord: LandlordPay | null = l.count > 0 ? {
    low: sqft ? Math.round(l.ppsft_low * sqft) : l.price_low,
    high: sqft ? Math.round(l.ppsft_high * sqft) : l.price_high,
    ppsfLow: l.ppsft_low, ppsfHigh: l.ppsft_high, priceLow: l.price_low, priceHigh: l.price_high, count: l.count,
    aggressive: l.aggressive_purchase_count, moderate: l.moderate_purchase_count, conservative: l.conservative_purchase_count,
  } : null;
  const activity = ([1, 2, 5, 10] as const).map((miles) => ({ miles, ...summary.radius_counts[`${miles}mi`] }));
  return { flipper, landlord, activity };
}
