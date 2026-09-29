import { describe, expect, it } from "vitest";
import { plausibleLevels, plausibleLotSqft, plausiblePrice, plausibleSqft } from "./plausible";

describe("plausible", () => {
  it("keeps normal values and blanks typos", () => {
    expect(plausibleLotSqft(6855)).toBe(6855);
    expect(plausibleLotSqft(871200871924)).toBeNull();
    expect(plausibleLevels(2)).toBe(2);
    expect(plausibleLevels(23)).toBeNull();
    expect(plausibleSqft(123389)).toBeNull();
    expect(plausiblePrice(1)).toBeNull();
    expect(plausiblePrice(429900)).toBe(429900);
    expect(plausibleSqft(null)).toBeNull();
  });
});
