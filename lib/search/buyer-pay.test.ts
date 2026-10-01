import { describe, expect, it } from "vitest";
import { whatBuyersPay } from "./buyer-pay";

// InvestorBase /v1/analytics-summary for 2847 S 64th Dr (2 mi, 24 mo)
const summary = {
  radius_counts: { "1mi": { flips: 17, rentals: 6 }, "2mi": { flips: 22, rentals: 15 }, "5mi": { flips: 245, rentals: 135 }, "10mi": { flips: 1058, rentals: 744 } },
  flipper_metrics: { count: 22, price_avg: 286955, price_low: 264965, price_high: 300053, ppsft_avg: 166, ppsft_low: 151, ppsft_high: 184, arv_pct_avg: 70, arv_pct_low: 71, arv_pct_high: 77 },
  landlord_metrics: { count: 15, price_avg: 810046, price_low: 329662, price_high: 426900, ppsft_avg: 511, ppsft_low: 202, ppsft_high: 270, aggressive_purchase_count: 3, moderate_purchase_count: 9, conservative_purchase_count: 1 },
};

describe("whatBuyersPay", () => {
  it("prices flippers off our ARV at the % of resale they pay here", () => {
    const p = whatBuyersPay(summary, 394_368, 1480);
    expect(p.flipper).toEqual({ low: 280_001, high: 303_663, pctLow: 71, pctHigh: 77, priceLow: 264_965, priceHigh: 300_053, ppsfLow: 151, ppsfHigh: 184, count: 22 });
  });

  it("prices landlords from their 33rd–67th percentile $/sqft on the subject's size (the mean is skewed)", () => {
    const p = whatBuyersPay(summary, 394_368, 1480);
    expect(p.landlord).toEqual({ low: 298_960, high: 399_600, ppsfLow: 202, ppsfHigh: 270, priceLow: 329_662, priceHigh: 426_900, count: 15, aggressive: 3, moderate: 9, conservative: 1 });
  });

  it("reports activity by radius", () => {
    expect(whatBuyersPay(summary, 394_368, 1480).activity).toEqual([
      { miles: 1, flips: 17, rentals: 6 }, { miles: 2, flips: 22, rentals: 15 }, { miles: 5, flips: 245, rentals: 135 }, { miles: 10, flips: 1058, rentals: 744 },
    ]);
  });

  it("orders a backwards % range and falls back to price ranges without ARV or sqft", () => {
    const p = whatBuyersPay({ ...summary, flipper_metrics: { ...summary.flipper_metrics, arv_pct_low: 80, arv_pct_high: 72 } }, null, null);
    expect(p.flipper).toMatchObject({ low: 264_965, high: 300_053, pctLow: 72, pctHigh: 80 });
    expect(p.landlord).toMatchObject({ low: 329_662, high: 426_900 });
  });

  it("is empty for a kind with no sales", () => {
    const p = whatBuyersPay({ ...summary, landlord_metrics: { ...summary.landlord_metrics, count: 0 } }, 394_368, 1480);
    expect(p.landlord).toBeNull();
  });
});
