/**
 * ARV / as-is backtest. Ground truth is ARMLS flip resales (for ARV) and clean
 * sales (for as-is): each one from the last 12 months is re-estimated from
 * only the sales closed before its month and compared to what it sold for.
 * Pending sales and pending offers are reported as supporting facts only —
 * never counted in accuracy or used to tune. Read-only; ~40 s.
 */
import { prisma } from "@/lib/prisma";
import { buildCompIndex, estimateArv, estimateAsIs, type ArvSubject, type ClosedComp, type CompIndex } from "./comps";
import { fetchComps } from "./load-comps";
import { loadInvestorIndex } from "./load-investor-buys";
import { loadRowsByIds } from "./load";

const MONTH_MS = 30.44 * 24 * 3600_000;
const TIERS = ["<300k", "300-450k", "450-700k", "700k+"] as const;
export type ValueTier = (typeof TIERS)[number];

export type ErrorStats = { n: number; medianMiss: number; bias: number; within5: number; within10: number; within15: number; p70: number };

export type SampleResult = {
  id: string; address: string; zip: string; status: string; condition: string; note: string | null;
  price: number; priceHigh: number | null; estimate: number | null; rangePct: number | null; missPct: number | null; counted: boolean;
};

export type ArvAccuracySummary = {
  ranAt: string;
  arv: { total: number; overall: ErrorStats | null; tiers: Partial<Record<ValueTier, ErrorStats>>; insideRangePct: number };
  asIs: { total: number; overall: ErrorStats | null; tiers: Partial<Record<ValueTier, ErrorStats>>; insideRangePct: number };
  samples: SampleResult[];
  /** Supporting only: ARV vs asking price of flips relisted and now pending. */
  pending: { under700: ErrorStats | null; over700: ErrorStats | null };
};

const pct = (values: number[], p: number) => { const s = [...values].sort((a, b) => a - b); return s[Math.floor((s.length - 1) * p)]; };
const round1 = (fraction: number) => Math.round(fraction * 1000) / 10;

/** Errors are fractions of the actual price (estimate / actual − 1). */
export function summarizeErrors(errs: number[]): ErrorStats | null {
  if (!errs.length) return null;
  const abs = errs.map(Math.abs);
  const within = (t: number) => Math.round((100 * abs.filter((e) => e <= t).length) / abs.length);
  return { n: errs.length, medianMiss: round1(pct(abs, 0.5)), bias: round1(pct(errs, 0.5)), within5: within(0.05), within10: within(0.1), within15: within(0.15), p70: round1(pct(abs, 0.7)) };
}

export function valueTier(v: number): ValueTier {
  return v < 300e3 ? "<300k" : v < 450e3 ? "300-450k" : v < 700e3 ? "450-700k" : "700k+";
}

/** A pending offer range is scored at its middle, and never counted. */
export function scoreSample(s: { status: string; price: number; priceHigh: number | null }, estimate: number | null) {
  if (estimate == null) return { missPct: null, counted: false };
  const actual = s.priceHigh ? (s.price + s.priceHigh) / 2 : s.price;
  return { missPct: round1(estimate / actual - 1), counted: s.status === "sold" };
}

const subjectOf = (t: ClosedComp): ArvSubject => ({
  id: t.propertyId ?? t.id, latitude: t.lat, longitude: t.lng, sqft: t.sqft, beds: t.beds, yearBuilt: t.yearBuilt,
  dwellingType: t.dwelling, zip: t.zip, subdivision: t.subdivision, lotSqft: t.lotSqft,
});

/** Re-estimates each test sale from sales closed before its month. */
function backtest(sales: ClosedComp[], isTest: (c: ClosedComp) => boolean, estimate: (s: ArvSubject, index: CompIndex, at: number) => { value: number; rangePct: number } | null) {
  const now = sales.reduce((m, c) => Math.max(m, c.closedAt), 0);
  const tests = sales.filter((c) => isTest(c) && c.closedAt >= now - 12 * MONTH_MS);
  const all: number[] = [];
  const byTier = new Map<ValueTier, number[]>();
  let inside = 0;
  for (let m = 12; m >= 1; m--) {
    const start = now - m * MONTH_MS;
    const index = buildCompIndex(sales.filter((c) => c.closedAt < start));
    for (const t of tests.filter((c) => c.closedAt >= start && c.closedAt < start + MONTH_MS)) {
      const est = estimate(subjectOf(t), index, start);
      if (!est) continue;
      const e = est.value / t.price - 1;
      all.push(e);
      (byTier.get(valueTier(est.value)) ?? byTier.set(valueTier(est.value), []).get(valueTier(est.value))!).push(e);
      if (Math.abs(e) <= est.rangePct / 100) inside++;
    }
  }
  const tiers: Partial<Record<ValueTier, ErrorStats>> = {};
  for (const t of TIERS) { const s = summarizeErrors(byTier.get(t) ?? []); if (s) tiers[t] = s; }
  return { total: tests.length, overall: summarizeErrors(all), tiers, insideRangePct: all.length ? Math.round((100 * inside) / all.length) : 0 };
}

async function scoreSamples(index: CompIndex): Promise<SampleResult[]> {
  const samples = await prisma.arvSample.findMany({ orderBy: { createdAt: "asc" } });
  const results: SampleResult[] = [];
  for (const s of samples) {
    const [p] = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "Property" WHERE "streetAddress" ILIKE ${s.address.trim() + "%"} AND zip = ${s.zip} LIMIT 1`;
    const [row] = p ? await loadRowsByIds([p.id]) : [];
    const est = row ? (s.condition === "clean" ? estimateAsIs(row, index) : estimateArv(row, index)) : null;
    const estimate = est ? ("value" in est ? est.value : est.arv) : null;
    results.push({
      id: s.id, address: s.address, zip: s.zip, status: s.status, condition: s.condition, note: s.note,
      price: s.price, priceHigh: s.priceHigh, estimate, rangePct: est?.rangePct ?? null, ...scoreSample(s, estimate),
    });
  }
  return results;
}

async function pendingFlips(index: CompIndex) {
  const pending = [...(await loadInvestorIndex()).cells.values()].flat()
    .filter((b) => b.kind === "Flipper" && b.exit?.price && /^(Pending|Under Contract)$/.test(b.exit.status));
  const rows = new Map((await loadRowsByIds(pending.map((b) => b.propertyId))).map((r) => [r.id, r]));
  const under: number[] = [], over: number[] = [];
  for (const b of pending) {
    const row = rows.get(b.propertyId);
    const est = row && estimateArv(row, index);
    if (est) (b.exit!.price! >= 700e3 ? over : under).push(est.arv / b.exit!.price! - 1);
  }
  return { under700: summarizeErrors(under), over700: summarizeErrors(over) };
}

export async function runArvBacktest(): Promise<ArvAccuracySummary> {
  const sales = await fetchComps(24);
  const arv = backtest(sales, (c) => c.flipResale === true, (s, index, at) => { const e = estimateArv(s, index, at); return e && { value: e.arv, rangePct: e.rangePct }; });
  const asIs = backtest(sales, (c) => !c.flipResale && !c.renovated && !c.fixer, (s, index, at) => estimateAsIs(s, index, at));
  const current = buildCompIndex(sales);
  const [samples, pending] = await Promise.all([scoreSamples(current), pendingFlips(current)]);
  return { ranAt: new Date().toISOString(), arv, asIs, samples, pending };
}

/** Runs the backtest and saves it for the Settings card. */
export async function recordArvAccuracyRun() {
  const started = Date.now();
  const summary = await runArvBacktest();
  return prisma.arvAccuracyRun.create({ data: { durationMs: Date.now() - started, summary } });
}
