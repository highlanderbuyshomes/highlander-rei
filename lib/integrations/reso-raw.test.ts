import { describe, expect, it } from "vitest";
import { RAW_KEYS, trimPropertyRaw, trimResoRaw } from "./reso-raw";

describe("trimResoRaw", () => {
  it("keeps only keys the app reads and drops empty values", () => {
    const listing = {
      ListingKey: "abc", PublicRemarks: "Needs TLC", ClosePrice: 350000, LivingArea: 1800,
      PoolPrivateYN: true, Stories: null, ElementarySchool: "Foo", Appliances: ["Dishwasher"], Levels: "",
    } as never;
    expect(trimResoRaw(listing)).toEqual({
      ListingKey: "abc", PublicRemarks: "Needs TLC", ClosePrice: 350000, LivingArea: 1800, PoolPrivateYN: true,
    });
  });

  it("keeps every key the search mapping reads", () => {
    const listing = Object.fromEntries(RAW_KEYS.map((k) => [k, "x"])) as never;
    expect(Object.keys(trimResoRaw(listing))).toEqual(RAW_KEYS);
  });

  it("keeps remarks, buyer financing and land-lease fields on closed sales", () => {
    expect(trimResoRaw({ StandardStatus: "Closed", PublicRemarks: "Remodeled", BuyerFinancing: "Cash", LandLeaseYN: false, Appliances: ["x"] } as never))
      .toEqual({ StandardStatus: "Closed", PublicRemarks: "Remodeled", BuyerFinancing: "Cash", LandLeaseYN: false });
  });

  it("keeps only search-mapping keys on the property copy", () => {
    expect(trimPropertyRaw({ LivingArea: 1800, PublicRemarks: "x", ListingKey: "k", PoolPrivateYN: false, Ownership: "Leasehold" } as never)).toEqual({ LivingArea: 1800, PoolPrivateYN: false, Ownership: "Leasehold" });
  });
});
