// ARV backtest: for every flip resale (a real after-repair sale) in the last
// 12 months, estimate its ARV from only the sales that had closed before that
// month, and compare to what it actually sold for. Re-run before changing
// anything in lib/search/comps.ts; read-only. The as-is section does the same
// for clean sales (no remodel, flip or fixer wording) against estimateAsIs.
//   npx tsx --env-file=.env.local scripts/backtest-arv.ts
import { buildCompIndex, estimateArv, estimateAsIs } from "../lib/search/comps";
import { fetchComps } from "../lib/search/load-comps";

const MONTH_MS = 30.44 * 24 * 3600_000;
const pct = (values: number[], p: number) => { const s = [...values].sort((a, b) => a - b); return s[Math.floor((s.length - 1) * p)]; };
const tier = (v: number) => (v < 300e3 ? "<300k" : v < 450e3 ? "300-450k" : v < 700e3 ? "450-700k" : "700k+");

function report(label: string, errs: number[]) {
  if (!errs.length) return;
  const abs = errs.map(Math.abs);
  const within = (t: number) => `${Math.round((100 * abs.filter((e) => e <= t).length) / abs.length)}%`;
  console.log(`${label.padEnd(30)} n=${String(errs.length).padStart(5)}  median miss ${(100 * pct(abs, 0.5)).toFixed(1)}%  bias ${(100 * pct(errs, 0.5)).toFixed(1)}%  ≤5% ${within(0.05)}  ≤10% ${within(0.1)}  ≤15% ${within(0.15)}  p70 ${(100 * pct(abs, 0.7)).toFixed(1)}%`);
}

async function main() {
  const sales = await fetchComps(24);
  const now = sales.reduce((m, c) => Math.max(m, c.closedAt), 0);
  const tests = sales.filter((c) => c.flipResale && c.closedAt >= now - 12 * MONTH_MS);
  const groups = new Map<string, number[]>();
  const add = (k: string, e: number) => (groups.get(k) ?? groups.set(k, []).get(k)!).push(e);
  let missing = 0;
  for (let m = 12; m >= 1; m--) {
    const start = now - m * MONTH_MS;
    const index = buildCompIndex(sales.filter((c) => c.closedAt < start));
    for (const t of tests.filter((c) => c.closedAt >= start && c.closedAt < start + MONTH_MS)) {
      const est = estimateArv({ id: t.propertyId ?? t.id, latitude: t.lat, longitude: t.lng, sqft: t.sqft, beds: t.beds, yearBuilt: t.yearBuilt, dwellingType: t.dwelling, zip: t.zip, subdivision: t.subdivision, lotSqft: t.lotSqft }, index, start);
      if (!est) { missing++; continue; }
      const e = est.arv / t.price - 1;
      for (const k of ["All", `ARV ${tier(est.arv)}`, `confidence ${est.confidence}`, `basis ${est.basis}`]) add(k, e);
      if (Math.abs(e) <= est.rangePct / 100) add("inside its ± range", 0);
    }
  }
  // As-is: clean sales, estimated from clean sales closed before their month.
  const cleanTests = sales.filter((c) => !c.flipResale && !c.renovated && !c.fixer && c.closedAt >= now - 12 * MONTH_MS);
  let asIsMissing = 0;
  for (let m = 12; m >= 1; m--) {
    const start = now - m * MONTH_MS;
    const index = buildCompIndex(sales.filter((c) => c.closedAt < start));
    for (const t of cleanTests.filter((c) => c.closedAt >= start && c.closedAt < start + MONTH_MS)) {
      const est = estimateAsIs({ id: t.propertyId ?? t.id, latitude: t.lat, longitude: t.lng, sqft: t.sqft, beds: t.beds, yearBuilt: t.yearBuilt, dwellingType: t.dwelling, zip: t.zip, subdivision: t.subdivision, lotSqft: t.lotSqft }, index, start);
      if (!est) { asIsMissing++; continue; }
      const e = est.value / t.price - 1;
      add("as-is: All", e);
      add(`as-is: ${tier(est.value)}`, e);
      if (Math.abs(e) <= est.rangePct / 100) add("as-is inside ± range", 0);
    }
  }
  console.log(`as-is: ${cleanTests.length} clean sales, ${asIsMissing} without an estimate; inside its ± range: ${Math.round((100 * (groups.get("as-is inside ± range")?.length ?? 0)) / (groups.get("as-is: All")?.length ?? 1))}%`);
  groups.delete("as-is inside ± range");
  console.log(`${tests.length} flip resales, ${missing} without an estimate`);
  for (const [k, v] of [...groups].sort()) if (k !== "inside its ± range") report(k, v);
  console.log(`inside its own ± range: ${Math.round((100 * (groups.get("inside its ± range")?.length ?? 0)) / (groups.get("All")?.length ?? 1))}%`);
}

main().then(() => process.exit(0), (err) => { console.error(err); process.exit(1); });
