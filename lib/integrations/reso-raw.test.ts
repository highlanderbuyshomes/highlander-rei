import { describe, expect, it } from "vitest";
import { RAW_KEYS, trimResoRaw } from "./reso-raw";

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
});
