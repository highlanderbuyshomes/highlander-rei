// One-time backfill: shrink existing RESO rawJson blobs to the keys the app reads.
// Dry run by default; pass --apply to write. Irreversible for dropped keys
// (a full re-pull restores them), so keep a backup first.
//   npx tsx --env-file=.env.local scripts/trim-reso-raw.ts [--apply]
//
// Safe to run with the database at its size cap: rows are trimmed in small
// batches and each batch is followed by a plain VACUUM, so the space the old
// blobs held is reused by the next batch instead of the table growing.
import { prisma } from "../lib/prisma";
import { trimPropertyRaw, trimResoRaw } from "../lib/integrations/reso-raw";

const APPLY = process.argv.includes("--apply");
const BATCH = 200;
const TRIM = { MlsListing: trimResoRaw, Property: trimPropertyRaw } as const;

async function dbSize() {
  const [r] = await prisma.$queryRawUnsafe<{ size: string }[]>(`SELECT pg_size_pretty(pg_database_size(current_database()))::text AS size`);
  return r.size;
}

async function trimTable(table: "MlsListing" | "Property") {
  let cursor = "";
  let rows = 0, before = 0, after = 0;
  for (;;) {
    const page = await prisma.$queryRawUnsafe<{ id: string; raw: Record<string, unknown> }[]>(
      `SELECT id, "rawJson" AS raw FROM "${table}"
       WHERE source = 'reso' AND "rawJson" IS NOT NULL AND id > $1
       ORDER BY id LIMIT ${BATCH}`,
      cursor,
    );
    if (page.length === 0) break;
    cursor = page[page.length - 1].id;
    // Only rows the current rules shrink; already-trimmed rows are skipped.
    const payload = [];
    for (const r of page) {
      const raw = TRIM[table](r.raw as never);
      const was = JSON.stringify(r.raw).length, now = JSON.stringify(raw).length;
      if (now < was) { payload.push({ id: r.id, raw }); before += was; after += now; }
    }
    if (payload.length === 0) continue;
    if (APPLY) {
      await prisma.$executeRawUnsafe(
        `UPDATE "${table}" t SET "rawJson" = x.raw FROM jsonb_to_recordset($1::jsonb) AS x(id text, raw jsonb) WHERE t.id = x.id`,
        JSON.stringify(payload),
      );
      await prisma.$executeRawUnsafe(`VACUUM "${table}"`);
    }
    rows += payload.length;
    if (APPLY && rows % 2000 < BATCH) console.log(`  ${table}: ${rows} rows trimmed, database ${await dbSize()}`);
  }
  console.log(`${table}: ${rows} rows, ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB${APPLY ? "" : " (dry run)"}`);
}

(async () => {
  console.log(`Database before: ${await dbSize()}`);
  try {
    await trimTable("MlsListing");
    await trimTable("Property");
  } catch (err) {
    console.error("Stopped:", err instanceof Error ? err.message.slice(0, 300) : err);
    console.error("Rows already trimmed stay trimmed; re-run to continue.");
    process.exitCode = 1;
  }
  console.log(`Database after: ${await dbSize()}`);
  await prisma.$disconnect();
})();
