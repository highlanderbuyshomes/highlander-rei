# ARV backtest — results log

Ground truth: ARMLS flip resales (a closed sale whose property was bought
30–365 days earlier) — what a renovated house actually sold for. For each
resale in the last 12 months, `scripts/backtest-arv.ts` estimates its ARV from
only the sales closed before that month (excluding the property's own sales)
and compares to the real price. Re-run it before changing `lib/search/comps.ts`;
a change ships only if it beats the current baseline.

    npx tsx --env-file=.env.local scripts/backtest-arv.ts [--save]

It also runs weekly (Mondays) and on demand from Admin → Settings → ARV
Accuracy, which shows the latest results.

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

## Clean as-is value — 2026-09-30

`estimateAsIs`: nearby sales with no remodel, flip-resale or fixer wording
(maintained homes), median size-adjusted $/sqft, same radius tiers as ARV.
Backtested the same way on 30,260 clean sales: **median miss 7.5%**, bias
+0.8%, 60% within 10%.

| Value | n | Median miss | ± range (p70) |
|---|---|---|---|
| < $300k | 2,391 | 8.6% | ±15% |
| $300–450k | 11,352 | 5.8% | ±10% |
| $450–700k | 9,919 | 7.2% | ±12% |
| $700k+ | 6,598 | 12.2% | ±20% |

ARV ÷ as-is = what a remodel adds in that pocket (2000s tract homes ~12–14%).

Tried and dropped: an "investor-implied ARV" check (flipper price ÷ average
% of resale). With few ARMLS-visible flips it false-alarmed on 2 of 4 samples,
so it didn't ship.

## Hand-checked samples

Private: kept in the database and managed in **Admin → Settings → ARV
Accuracy** (this repo is public, so no deal details live here). Each run
re-scores them — `clean` against the as-is value, `remodeled` against the ARV;
`pending` (an accepted offer) is shown as a supporting fact only.

## Supporting evidence — pending flip relists (not ground truth)

Flips relisted and now pending/under contract, ARV vs their asking price.
Contract prices are unknown until close and deals fall through, so this is
context, not a target. 2026-09-30: under $700k, 76 homes, median miss 7.6%,
bias −1.7% (agrees); $700k+, 54 homes, bias −13.5% (same luxury gap as sold
data). The Comps panel shows nearby pending flips the same way: "N pending
flips nearby · asking $X–Y/ft · not in ARV".

## Known gaps

- **$700k+**: finish level (luxury vs basic update), views and pools drive
  price; ARMLS fields can't see them. Photo-based remodel scoring is the lever
  (designed, paused).
- **Thin comp sets** (3 comps) — cross-check against what investors
  pay: flippers pay ~66–69% of resale, so investor price ÷ that ratio is an
  independent ARV check.
