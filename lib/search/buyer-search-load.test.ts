import { describe, expect, it } from "vitest";
import { buyerSearchBody } from "./buyer-search-load";

describe("buyerSearchBody", () => {
  it("searches by full address with the app's defaults and no CRM deal", () => {
    expect(buyerSearchBody({ address: "123 E Main St", city: "Mesa", state: "AZ", zip: "85201", dwellingType: "Condo" })).toEqual({
      address: "123 E Main St, Mesa, AZ 85201", property_types: ["CONDO"], radius_miles: 2, lookback_years: 2, create_deal: false,
    });
  });
});
