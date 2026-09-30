// ARV / as-is backtest (lib/search/backtest.ts) from the command line. Re-run
// before changing lib/search/comps.ts; read-only unless --save, which records
// the run for the Settings > ARV accuracy card.
//   npx tsx --env-file=.env.local scripts/backtest-arv.ts [--save]
import { recordArvAccuracyRun, runArvBacktest, type ErrorStats } from "../lib/search/backtest";

const line = (label: string, s: ErrorStats | null | undefined) =>
  console.log(s ? `${label.padEnd(26)} n=${String(s.n).padStart(5)}  median miss ${s.medianMiss}%  bias ${s.bias}%  ≤5% ${s.within5}%  ≤10% ${s.within10}%  ≤15% ${s.within15}%  p70 ${s.p70}%` : `${label.padEnd(26)} —`);

async function main() {
  const summary = process.argv.includes("--save") ? ((await recordArvAccuracyRun()).summary as unknown as Awaited<ReturnType<typeof runArvBacktest>>) : await runArvBacktest();
  for (const [name, part] of [["ARV (flip resales)", summary.arv], ["As-is (clean sales)", summary.asIs]] as const) {
    console.log(`\n${name}: ${part.total} tested, ${part.insideRangePct}% inside their ± range`);
    line("All", part.overall);
    for (const [tier, s] of Object.entries(part.tiers)) line(tier, s);
  }
  console.log("\nSamples (pending = supporting, not counted):");
  for (const s of summary.samples) console.log(`  ${s.status === "pending" ? "(supporting) " : ""}${s.address}, ${s.zip}: ${s.condition === "clean" ? "as-is" : "ARV"} ${s.estimate ?? "—"} | ${s.status} ${s.price}${s.priceHigh ? `–${s.priceHigh}` : ""} | ${s.missPct ?? "—"}%`);
  console.log("\nSupporting (not ground truth): ARV vs pending flip asking prices");
  line("under $700k", summary.pending.under700);
  line("$700k+", summary.pending.over700);
}

main().then(() => process.exit(0), (err) => { console.error(err); process.exit(1); });
