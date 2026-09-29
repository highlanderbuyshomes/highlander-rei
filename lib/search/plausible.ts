// MLS data has typos (an 871,200,871,924 sq ft lot, 23-story houses, $1
// auction placeholders). Values outside these bounds are treated as missing
// so they never display or skew ARV and scoring.

const within = (min: number, max: number) => (v: number | null | undefined): number | null =>
  v == null || !Number.isFinite(v) || v < min || v > max ? null : v;

export const plausibleSqft = within(300, 30_000);
export const plausibleLotSqft = within(1, 10_000_000); // ~230 acres
export const plausibleLevels = within(1, 5);
export const plausibleBeds = within(0, 20);
export const plausibleBaths = within(0, 20);
export const plausibleYearBuilt = within(1850, new Date().getFullYear() + 2);
export const plausiblePrice = within(10_000, 100_000_000);
export const plausibleDom = within(0, 5_000);
