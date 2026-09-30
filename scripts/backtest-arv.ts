// ARV backtest: for every flip resale (a real after-repair sale) in the last
// 12 months, estimate its ARV from only the sales that had closed before that
// month, and compare to what it actually sold for. Re-run before changing
// anything in lib/search/comps.ts; read-only. The as-is section does the same
// for clean sales (no remodel, flip or fixer wording) against estimateAsIs.
//   npx tsx --env-file=.env.local scripts/backtest-arv.ts
import { readFileSync } from "node:fs";
import { prisma } from "../lib/prisma";
import { buildCompIndex, estimateArv, estimateAsIs } from "../lib/search/comps";
import { fetchComps } from "../lib/search/load-comps";
import { loadInvestorIndex } from "../lib/search/load-investor-buys";
import { loadRowsByIds } from "../lib/search/load";

type Sample = { address: string; zip: string; status: "sold" | "pending"; price: number; priceHigh?: number; date?: string; condition: "remodeled" | "clean"; note?: string };

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
  const current = buildCompIndex(sales);
  await reportSamples(current);
  await reportPendingFlips(current);
  console.log(`inside its own ± range: ${Math.round((100 * (groups.get("inside its ± range")?.length ?? 0)) / (groups.get("All")?.length ?? 1))}%`);
}

/** data/arv-samples.json, re-scored with today's engine. Pending = supporting only. */
async function reportSamples(index: ReturnType<typeof buildCompIndex>) {
  const { samples } = JSON.parse(readFileSync(new URL("../data/arv-samples.json", import.meta.url), "utf8")) as { samples: Sample[] };
  console.log("\nHand-checked samples (current engine; pending = supporting fact, not counted):");
  for (const s of samples) {
    const [p] = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "Property" WHERE "streetAddress" ILIKE ${s.address + "%"} AND zip = ${s.zip} LIMIT 1`;
    const [row] = p ? await loadRowsByIds([p.id]) : [];
    const est = row && (s.condition === "clean" ? estimateAsIs(row, index) : estimateArv(row, index));
    const value = est ? ("value" in est ? est.value : est.arv) : null;
    const mid = s.priceHigh ? (s.price + s.priceHigh) / 2 : s.price;
    const miss = value ? `${((value / mid - 1) * 100).toFixed(1)}% vs ${s.status}` : "no estimate";
    console.log(`  ${s.status === "pending" ? "(supporting) " : ""}${s.address}, ${s.zip}: ${s.condition === "clean" ? "as-is" : "ARV"} ${value ?? "—"} ±${est?.rangePct ?? "—"}% | ${s.status} ${s.price}${s.priceHigh ? `–${s.priceHigh}` : ""} | ${miss}`);
  }
}

/**
 * Flips relisted and now pending/under contract, ARV vs their asking price.
 * Supporting evidence only — contract prices are unknown and deals fall
 * through — so never a tuning target.
 */
async function reportPendingFlips(index: ReturnType<typeof buildCompIndex>) {
  const pending = [...(await loadInvestorIndex()).cells.values()].flat()
    .filter((b) => b.kind === "Flipper" && b.exit?.price && /^(Pending|Under Contract)$/.test(b.exit.status));
  const rows = new Map((await loadRowsByIds(pending.map((b) => b.propertyId))).map((r) => [r.id, r]));
  const errs: number[] = [], high: number[] = [];
  for (const b of pending) {
    const row = rows.get(b.propertyId);
    const est = row && estimateArv(row, index);
    if (!est) continue;
    const e = est.arv / b.exit!.price! - 1;
    (b.exit!.price! >= 700e3 ? high : errs).push(e);
  }
  console.log("\nSupporting (not ground truth): ARV vs asking price of pending flip relists");
  report("pending flips <700k ask", errs);
  report("pending flips 700k+ ask", high);
}

main().then(() => process.exit(0), (err) => { console.error(err); process.exit(1); });
