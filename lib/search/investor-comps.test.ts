import { describe, expect, it } from "vitest";
import type { ArvSubject } from "./comps";
import {
  buildInvestorIndex, classifyInvestorBuy, findInvestorComps, smartMatchScore, type InvestorBuyRecord,
} from "./investor-comps";

const NOW = Date.parse("2026-09-30T00:00:00Z");
const DAY = 24 * 3600_000;
const MILE_LAT = 1 / 69.1; // degrees of latitude per mile

const subject: ArvSubject = {
  id: "s", latitude: 33.5, longitude: -112, sqft: 1500, beds: 3, yearBuilt: 1985,
  dwellingType: "Single Family", zip: "85018", subdivision: "Arcadia Lite",
};

const buy = (i: number, o: Partial<InvestorBuyRecord> = {}): InvestorBuyRecord => ({
  id: `b${i}`, propertyId: `p${i}`, lat: 33.5 + 0.1 * MILE_LAT * i, lng: -112, sqft: 1500, beds: 3, baths: 2, yearBuilt: 1985,
  dwelling: "Single Family", subdivision: null, price: 300_000, soldAt: NOW - 60 * DAY,
  address: `${i} Buy St`, city: "Phoenix", kind: "Flipper", exit: null, rent: null, ...o,
});

const opts = { radiusMiles: 2, months: 24, arv: 500_000, types: "same" as const };

describe("classifyInvestorBuy", () => {
  const soldAt = NOW - 400 * DAY;
  const at = (days: number) => soldAt + days * DAY;

  it("relist 30–365 days after purchase is a flipper", () => {
    expect(classifyInvestorBuy({ soldAt, relistAt: at(30), rentalAt: null })).toBe("Flipper");
    expect(classifyInvestorBuy({ soldAt, relistAt: at(365), rentalAt: null })).toBe("Flipper");
  });
  it("relist under 30 days is unclassified", () => {
    expect(classifyInvestorBuy({ soldAt, relistAt: at(29), rentalAt: null })).toBeNull();
    expect(classifyInvestorBuy({ soldAt, relistAt: at(10), rentalAt: at(5) })).toBeNull();
  });
  it("rental listing within a year is a landlord", () => {
    expect(classifyInvestorBuy({ soldAt: NOW - 90 * DAY, relistAt: null, rentalAt: NOW - 40 * DAY })).toBe("Landlord");
  });
  it("rental before a sale relist is a landlord", () => {
    expect(classifyInvestorBuy({ soldAt, relistAt: at(200), rentalAt: at(60) })).toBe("Landlord");
  });
  it("sale relist before a rental is a flipper", () => {
    expect(classifyInvestorBuy({ soldAt, relistAt: at(60), rentalAt: at(200) })).toBe("Flipper");
  });
  it("holding without a rental listing is not evidence of a landlord", () => {
    // A cash buyer who moves in holds too; only a rental listing says landlord.
    expect(classifyInvestorBuy({ soldAt: NOW - 700 * DAY, relistAt: null, rentalAt: null })).toBeNull();
    expect(classifyInvestorBuy({ soldAt, relistAt: at(500), rentalAt: null })).toBeNull();
  });
  it("recent buy with no signal is unclassified", () => {
    expect(classifyInvestorBuy({ soldAt: NOW - 100 * DAY, relistAt: null, rentalAt: null })).toBeNull();
  });
  it("rental more than a year later does not count", () => {
    expect(classifyInvestorBuy({ soldAt: NOW - 100 * DAY, relistAt: null, rentalAt: null })).toBeNull();
    expect(classifyInvestorBuy({ soldAt, relistAt: null, rentalAt: at(380) })).toBeNull();
  });
});

describe("smartMatchScore", () => {
  const o = { radiusMiles: 2, months: 24 };
  it("identical, same place, same subdivision, today is 100", () => {
    expect(smartMatchScore(subject, buy(0, { soldAt: NOW, subdivision: "arcadia lite" }), 0, o, NOW)).toBe(100);
  });
  it("at the radius, 25% sqft apart, beds ±2, 20 yrs apart, period start is 0", () => {
    const b = buy(0, { sqft: 1875, beds: 5, yearBuilt: 2005, soldAt: NOW - 24 * 30.44 * DAY });
    expect(smartMatchScore(subject, b, 2, o, NOW)).toBe(0);
  });
  it("beds ±1 gives partial credit and unknowns give none", () => {
    const base = buy(0, { soldAt: NOW });
    expect(smartMatchScore(subject, { ...base, beds: 4 }, 0, o, NOW)).toBe(82);
    expect(smartMatchScore(subject, { ...base, beds: null, yearBuilt: null }, 0, o, NOW)).toBe(65);
  });
});

describe("findInvestorComps", () => {
  it("prices each kind from the top-5 median $/sqft and % of ARV", () => {
    const buys = [
      ...[1, 2, 3, 4, 5, 6].map((i) => buy(i, { price: 270_000 + i * 10_000 })), // flippers, $190–220/sqft
      ...[7, 8, 9].map((i) => buy(i, { kind: "Landlord", price: 330_000 })),
    ];
    const r = findInvestorComps(subject, buildInvestorIndex(buys), opts, NOW);
    expect(r.flipper.count).toBe(6);
    // top 5 by score are the nearest (b1–b5): prices 280k..320k, median 300k
    expect(r.flipper.price).toBe(300_000);
    expect(r.flipper.pctArv).toBe(60);
    expect(r.flipper.ppsf).toBe(200);
    // 25th–75th percentile of all six flip buys (280k..330k)
    expect([r.flipper.low, r.flipper.high]).toEqual([292_500, 317_500]);
    expect(r.landlord).toMatchObject({ price: 330_000, pctArv: 66, count: 3, ppsf: 220, low: 330_000, high: 330_000 });
    expect(r.buys.map((b) => b.id).slice(0, 2)).toEqual(["b1", "b2"]);
  });

  it("fewer than 3 of a kind gives no price but keeps the count", () => {
    const r = findInvestorComps(subject, buildInvestorIndex([buy(1), buy(2, { kind: "Landlord" })]), opts, NOW);
    expect(r.flipper).toMatchObject({ price: null, pctArv: null, count: 1, ppsf: null, low: null, high: null });
    expect(r.landlord.count).toBe(1);
  });

  it("no ARV gives a price without % of ARV", () => {
    const r = findInvestorComps(subject, buildInvestorIndex([1, 2, 3].map((i) => buy(i))), { ...opts, arv: null }, NOW);
    expect(r.flipper.price).toBe(300_000);
    expect(r.flipper.pctArv).toBeNull();
  });

  it("tags the top 5 scoring ≥ 60 as Smart Match", () => {
    const buys = [1, 2, 3, 4, 5, 6, 7].map((i) => buy(i));
    const far = buy(8, { lat: 33.5 + 1.9 * MILE_LAT, sqft: 1850, beds: 5, yearBuilt: 2004, soldAt: NOW - 700 * DAY });
    const r = findInvestorComps(subject, buildInvestorIndex([...buys, far]), opts, NOW);
    expect(r.buys.filter((b) => b.smartMatch).map((b) => b.id)).toEqual(["b1", "b2", "b3", "b4", "b5"]);
    expect(r.buys.find((b) => b.id === "b8")!.smartMatch).toBe(false);
  });

  it("filters by radius, period, dwelling class and the subject itself", () => {
    const buys = [
      buy(1),
      buy(2, { lat: 33.5 + 2.5 * MILE_LAT }), // beyond 2 mi
      buy(3, { soldAt: NOW - 400 * DAY }), // outside 12 months
      buy(4, { dwelling: "Condo" }),
      buy(5, { propertyId: "s" }), // the subject property's own purchase
    ];
    const r = findInvestorComps(subject, buildInvestorIndex(buys), { ...opts, months: 12 }, NOW);
    expect(r.buys.map((b) => b.id)).toEqual(["b1"]);
  });

  it("Any type mixes residential classes and drops the attached distance cap", () => {
    const buys = [
      buy(1),
      buy(2, { dwelling: "Townhouse", lat: 33.5 + 1 * MILE_LAT }),
      buy(3, { dwelling: "Condo" }),
    ];
    const r = findInvestorComps(subject, buildInvestorIndex(buys), { ...opts, types: "any" }, NOW);
    expect(r.buys.map((b) => b.id).sort()).toEqual(["b1", "b2", "b3"]);
    const same = findInvestorComps(subject, buildInvestorIndex(buys), opts, NOW);
    expect(same.buys.map((b) => b.id)).toEqual(["b1"]);
  });

  it("attached homes beyond 0.5 mi only count in the same subdivision", () => {
    const condo: ArvSubject = { ...subject, dwellingType: "Condo", subdivision: "The Palms" };
    const buys = [
      buy(1, { dwelling: "Condo", lat: 33.5 + 0.3 * MILE_LAT }),
      buy(2, { dwelling: "Condo", lat: 33.5 + 1 * MILE_LAT }),
      buy(3, { dwelling: "Condo", lat: 33.5 + 1 * MILE_LAT, subdivision: "the palms" }),
    ];
    const r = findInvestorComps(condo, buildInvestorIndex(buys), opts, NOW);
    expect(r.buys.map((b) => b.id).sort()).toEqual(["b1", "b3"]);
  });

  it("reports a missing location or sqft instead of results", () => {
    const index = buildInvestorIndex([buy(1)]);
    expect(findInvestorComps({ ...subject, latitude: null }, index, opts, NOW).missing).toBe("location");
    expect(findInvestorComps({ ...subject, sqft: null }, index, opts, NOW).missing).toBe("sqft");
    expect(findInvestorComps({ ...subject, sqft: null }, index, opts, NOW).buys).toEqual([]);
  });

  it("% of resale per flip and on average, from closed resales only (InvestorBase's % of ARV paid)", () => {
    const at = NOW - 10 * DAY;
    const buys = [
      buy(1, { price: 300_000, exit: { price: 400_000, at, status: "Closed" } }), // 75%
      buy(2, { price: 260_000, exit: { price: 400_000, at, status: "Closed" } }), // 65%
      buy(3, { price: 250_000, exit: { price: 500_000, at, status: "Active" } }), // asking, not a sale
      buy(4, { kind: "Landlord", rent: 2_000 }),
    ];
    const r = findInvestorComps(subject, buildInvestorIndex(buys), opts, NOW);
    const row = (id: string) => r.buys.find((b) => b.id === id)!;
    expect(row("b1").pctOfResale).toBe(75);
    expect(row("b3").pctOfResale).toBeNull();
    expect(row("b4").pctOfResale).toBeNull();
    expect(r.flipper.pctOfResale).toBe(70);
    expect(r.landlord.pctOfResale).toBeNull();
  });

  it("carries flipper exits and landlord rents to the row", () => {
    const buys = [
      buy(1, { exit: { price: 450_000, at: NOW - 10 * DAY, status: "Closed" } }),
      buy(2, { kind: "Landlord", rent: 2_100 }),
    ];
    const r = findInvestorComps(subject, buildInvestorIndex(buys), opts, NOW);
    const b1 = r.buys.find((b) => b.id === "b1")!;
    expect(b1.exit).toEqual({ price: 450_000, date: new Date(NOW - 10 * DAY).toISOString(), status: "Closed" });
    expect(r.buys.find((b) => b.id === "b2")!.rent).toBe(2_100);
    expect(b1.dwelling).toBe("Single Family");
  });
});
