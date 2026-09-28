// One-time backfill: shrink existing RESO rawJson blobs to the keys the app reads.
// Dry run by default; pass --apply to write. Irreversible for dropped keys
// (a full re-pull restores them), so take a Neon branch/snapshot first.
//   npx tsx --env-file=.env.local scripts/trim-reso-raw.ts [--apply]
import { prisma } from "../lib/prisma";
import { trimResoRaw } from "../lib/integrations/reso-raw";

const APPLY = process.argv.includes("--apply");
const BATCH = 500;

async function trimTable(table: "MlsListing" | "Property") {
  let cursor = "";
  let rows = 0, before = 0, after = 0;
  for (;;) {
    const page = await prisma.$queryRawUnsafe<{ id: string; raw: Record<string, unknown> }[]>(
      `SELECT id, "rawJson" AS raw FROM "${table}" WHERE source = 'reso' AND "rawJson" IS NOT NULL AND id > $1 ORDER BY id LIMIT ${BATCH}`,
      cursor,
    );
    if (page.length === 0) break;
    const payload = page.map((r) => ({ id: r.id, raw: trimResoRaw(r.raw as never) }));
    for (let i = 0; i < page.length; i++) {
      before += JSON.stringify(page[i].raw).length;
      after += JSON.stringify(payload[i].raw).length;
    }
    if (APPLY) {
      await prisma.$executeRawUnsafe(
        `UPDATE "${table}" t SET "rawJson" = x.raw FROM jsonb_to_recordset($1::jsonb) AS x(id text, raw jsonb) WHERE t.id = x.id`,
        JSON.stringify(payload),
      );
    }
    rows += page.length;
    cursor = page[page.length - 1].id;
  }
  console.log(`${table}: ${rows} rows, ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB${APPLY ? "" : " (dry run)"}`);
}

(async () => {
  await trimTable("MlsListing");
  await trimTable("Property");
  if (APPLY) console.log('Done. Run VACUUM (FULL) "MlsListing", "Property" in the Neon SQL editor to release the space.');
  await prisma.$disconnect();
})();
