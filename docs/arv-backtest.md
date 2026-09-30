# ARV backtest — results log

Ground truth: ARMLS flip resales (a closed sale whose property was bought
30–365 days earlier) — what a renovated house actually sold for. For each
resale in the last 12 months, `scripts/backtest-arv.ts` estimates its ARV from
only the sales closed before that month (excluding the property's own sales)
and compares to the real price. Re-run it before changing `lib/search/comps.ts`;
a change ships only if it beats the current baseline.

    npx tsx --env-file=.env.local scripts/backtest-arv.ts

## Current baseline — 2026-09-30 (main @ 4c17964)

1,205 of 1,209 resales estimated. **Median miss 8.6%**, bias −0.6%, 55% within
10%, 73% within 15%. 73% of resales land inside their own ± range (target 70%).

| Estimated ARV | n | Median miss | Within 10% | ± range (p70) |
|---|---|---|---|---|
| < $300k | 115 | 9.8% | 51% | ±14% |
| $300–450k | 376 | 6.3% | 68% | ±10% |
| $450–700k | 394 | 8.3% | 56% | ±13% |
| $700k+ | 320 | 13.2% | 41% | ±22% |
| Low confidence | 116 | 15.6% | 33% | ±25% |

Before tuning (plain $/sqft, renovated comps at the median, no lot match):
9.6% median miss, 52% within 10%.

## What moved it

| Change | Median miss |
|---|---|
| Baseline | 9.6% |
| Size-adjusted $/sqft (exponent 0.4) | 9.3–9.4% |
| + keyword-renovated comps at P65 (median ran ~3% low) | 8.7% |
| + lots within ±50% | 8.5% |
| + exclude the subject property's own sales (bug fix; honest measure) | 8.6% |

Tried, no gain: market-trend (time) adjustment of comp prices; skipping the
flip-resale step (worse); higher percentile for the $700k+ fallback.

## Samples checked by hand

| Property | Actual | ARV | Miss | Notes |
|---|---|---|---|---|
| 4241 N 82nd Dr, 85033 | $410,000 (Steven's resale) | $404,183 ±10% | −1.4% | Flip resales, High, 6 comps |
| 2437 E North Ln, 85028 | $1,025,000 (flip: bought $645k conventional, 5 mo) | $819,541 ±22% | −20.0% | Luxury finishes ($464/ft vs $312–381/ft renovated comps); outside range |
| 4902 E Granada Rd, 85008 | — | $392,107 ±10% | — | Medium, 3 comps; flippers pay 85% of it → ARV likely low |

## Known gaps

- **$700k+**: finish level (luxury vs basic update), views and pools drive
  price; ARMLS fields can't see them. Photo-based remodel scoring is the lever
  (designed, paused).
- **Thin comp sets** (Granada: 3 comps) — cross-check against what investors
  pay: flippers pay ~66–69% of resale, so investor price ÷ that ratio is an
  independent ARV check.
