// Condition/motivation language in listing remarks that flags a likely
// fixer or motivated seller. Shared so the server can turn the (long)
// remarks text into a boolean before it's sent to the browser.
export const DISTRESS_WORDS = ["fixer", "as-is", "as is", "cash only", "needs repair", "needs updating", "investor", "estate sale", "original condition", "handyman"];

export function hasDistressLanguage(remarks: string | null | undefined): boolean {
  const text = remarks?.toLowerCase() ?? "";
  return DISTRESS_WORDS.some((word) => text.includes(word));
}
