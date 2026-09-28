import { describe, expect, it } from "vitest";
import { fillTemplate, mlsLinks } from "./mls-links";

const listing = { mlsNumber: "6912345", address: "123 E Main St", city: "Mesa", zip: "85201" };

describe("mls links", () => {
  it("fills placeholders URL-encoded", () => {
    expect(fillTemplate("https://x/listing/{mls}?q={address}", listing)).toBe(
      "https://x/listing/6912345?q=123%20E%20Main%20St%2C%20Mesa%2C%20AZ%2085201",
    );
  });

  it("links CurbView straight to the ARMLS listing by MLS #", () => {
    expect(mlsLinks(listing).curbview.href).toBe("https://curbview.com/mls/1/listings/6912345");
    expect(mlsLinks(listing).flexmls.copy).toBe("6912345");
  });
});
