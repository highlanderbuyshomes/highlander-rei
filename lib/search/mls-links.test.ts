import { describe, expect, it } from "vitest";
import { fillTemplate, mlsLinks } from "./mls-links";

const listing = { mlsNumber: "6912345", address: "123 E Main St", city: "Mesa", zip: "85201" };

describe("mls links", () => {
  it("fills placeholders URL-encoded", () => {
    expect(fillTemplate("https://x/listing/{mls}?q={address}", listing)).toBe(
      "https://x/listing/6912345?q=123%20E%20Main%20St%2C%20Mesa%2C%20AZ%2085201",
    );
  });

  it("copies the MLS # for Flexmls and the address for Monsoon", () => {
    const links = mlsLinks(listing);
    expect(links.flexmls.copy).toBe("6912345");
    expect(links.monsoon.copy).toBe("123 E Main St, Mesa, AZ 85201");
  });
});
