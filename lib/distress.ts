// Listing-remarks language, matched on whole words. Shared so the server can
// turn the (long) remarks text into booleans before it's sent to the browser,
// and so SQL (Postgres regex) and JS agree on what counts.

/** The seller wants out: pricing, timing or life-event language. */
export const MOTIVATED_PHRASES = [
  "motivated", "must sell", "must be sold", "bring all offers", "bring offers", "bring your offers", "all offers considered",
  "make an offer", "submit all offers", "priced to sell", "priced below", "below market", "below appraisal",
  "quick close", "fast close", "close quickly", "cash only", "cash offers only", "cash or hard money",
  "estate sale", "probate", "trust sale", "relocating", "relocation", "divorce", "short sale", "bank owned", "reo",
  "foreclosure", "pre-foreclosure", "auction", "seller says sell", "no reasonable offer refused",
];

/** The house needs work. */
export const CONDITION_PHRASES = [
  "fixer", "fixer upper", "fixer-upper", "handyman", "handyman special", "investor special", "contractor special",
  "needs work", "needs tlc", "tlc", "needs some love", "needs repair", "needs repairs", "needs updating", "needs updates",
  "original condition", "sold as is", "sold as-is", "as-is", "being sold as is", "deferred maintenance", "sweat equity",
  "bring your contractor", "bring your tools", "tear down", "teardown", "cosmetic fixer", "rehab", "value add",
];

/** The house was redone: marks a closed sale as a renovated (ARV) comp. */
export const RENOVATED_PHRASES = [
  "remodeled", "renovated", "fully updated", "completely updated", "newly updated", "tastefully updated",
  "totally updated", "rehabbed", "flipped", "turnkey", "turn key", "new kitchen", "new flooring", "new floors",
  "new cabinets", "new countertops", "quartz countertops", "new roof", "new hvac", "new ac", "new a/c",
  "brand new", "down to the studs", "fully renovated", "move-in ready", "move in ready",
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Postgres case-insensitive (`~*`) pattern with word boundaries (\m \M). */
export function pgPhraseRegex(phrases: string[]): string {
  return `\\m(${phrases.map(escape).join("|")})\\M`;
}

function jsPhraseRegex(phrases: string[]): RegExp {
  return new RegExp(`\\b(${phrases.map(escape).join("|")})\\b`, "i");
}

const MOTIVATED_RE = jsPhraseRegex(MOTIVATED_PHRASES);
const CONDITION_RE = jsPhraseRegex(CONDITION_PHRASES);
const RENOVATED_RE = jsPhraseRegex(RENOVATED_PHRASES);

export const hasMotivatedLanguage = (remarks: string | null | undefined) => MOTIVATED_RE.test(remarks ?? "");
export const hasConditionLanguage = (remarks: string | null | undefined) => CONDITION_RE.test(remarks ?? "");
export const hasRenovatedLanguage = (remarks: string | null | undefined) => RENOVATED_RE.test(remarks ?? "");

/** Kept for callers that only want "fixer or motivated". */
export function hasDistressLanguage(remarks: string | null | undefined): boolean {
  return hasMotivatedLanguage(remarks) || hasConditionLanguage(remarks);
}
