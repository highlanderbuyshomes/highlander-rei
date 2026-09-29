import { describe, expect, it } from "vitest";
import { hasConditionLanguage, hasMotivatedLanguage, hasRenovatedLanguage, pgPhraseRegex } from "./distress";

describe("remarks language", () => {
  it("detects motivated sellers", () => {
    expect(hasMotivatedLanguage("MOTIVATED SELLER, bring all offers!")).toBe(true);
    expect(hasMotivatedLanguage("Estate sale, priced to sell.")).toBe(true);
    expect(hasMotivatedLanguage("Beautiful home near parks.")).toBe(false);
  });

  it("detects fixers on whole words only", () => {
    expect(hasConditionLanguage("Handyman special, needs TLC.")).toBe(true);
    expect(hasConditionLanguage("Great for investors and families")).toBe(false);
    expect(hasConditionLanguage("Settlement of the estate")).toBe(false);
  });

  it("detects renovated sales", () => {
    expect(hasRenovatedLanguage("Fully remodeled with quartz countertops")).toBe(true);
    expect(hasRenovatedLanguage("Needs updating")).toBe(false);
  });

  it("builds a Postgres word-boundary pattern", () => {
    expect(pgPhraseRegex(["must sell", "a/c"])).toBe("\\m(must sell|a/c)\\M");
  });
});
