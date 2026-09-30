// One-time backfill: 24 months of ARMLS rental listings into RentalListing,
// for Investor comps' landlord detection. Dry run by default (reads one page,
// writes nothing); pass --apply to write. Safe to re-run: rows upsert by MLS #.
// The completed run it records is the watermark the 10-minute cron continues from.
//   npx tsx --env-file=.env.local scripts/backfill-rentals.ts [--apply]
import { fetchResoListingPages, type ResoScopeOpts } from "../lib/integrations/reso";
import { VALLEY_COUNTIES } from "../lib/integrations/reso-sync-plan";
import { syncRentalListings, toRentalRow } from "../lib/integrations/rental-sync";

const APPLY = process.argv.includes("--apply");
const MONTHS = 24;

async function main() {
  const since = new Date();
  since.setMonth(since.getMonth() - MONTHS);
  const started = new Date();
  const scope: ResoScopeOpts = { counties: VALLEY_COUNTIES, modifiedSince: since.toISOString() };
  console.log(`Rental listings modified since ${scope.modifiedSince} in ${VALLEY_COUNTIES.join(", ")}`);

  if (!APPLY) {
    for await (const { listings, nextLink } of fetchResoListingPages({ ...scope, leaseOnly: true })) {
      const rows = listings.map(toRentalRow).filter((r) => r != null);
      console.log(`First page: ${listings.length} listings → ${rows.length} rows${nextLink ? " (more pages follow)" : ""}`);
      console.log(rows.slice(0, 3));
      break;
    }
    console.log("Dry run — nothing written. Re-run with --apply.");
    return;
  }

  const result = await syncRentalListings(scope, { meta: { watermark: started.toISOString() } });
  console.log(`Done: ${result.fetched} fetched, ${result.saved} saved (run ${result.importRunId})`);
}

main().then(() => process.exit(0), (err) => { console.error(err); process.exit(1); });
