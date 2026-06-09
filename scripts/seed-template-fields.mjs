/**
 * Seeds signature/initials/date fields for all agreement templates.
 *
 * Layout per user spec:
 *  - Every page: Seller initials bottom-left, Buyer initials bottom-right
 *  - Signature page (last page): Seller sig+date left, Buyer sig+date right
 *  - If 2 sellers: Seller 2 sig+date below Seller 1 on last page
 *
 * signerIndex:  0 = Seller 1 | 1 = Seller 2 | 2 = Buyer
 *   (for 1-seller agreements signerIndex 1 = Buyer)
 */

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

// Load .env.local manually
const envLines = readFileSync(".env.local", "utf8").split("\n");
for (const line of envLines) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, "$1");
}

const sql = neon(process.env.DATABASE_URL);

// ── Layout constants ──────────────────────────────────────────────────────────

// Initials box at the very bottom of every page
const INITIALS = { w: 0.09, h: 0.035, y: 0.945 };
const SELLER1_INIT_X = 0.04;   // left
const SELLER2_INIT_X = 0.145;  // next to seller 1
const BUYER_INIT_X   = 0.76;   // right

// Signature + date on last page  (left column = sellers, right = buyer)
// Measured from v2_1 PDF — sigs sit in upper third of the signature page
const SIG_Y_S1   = 0.28;   // Seller 1 signature
const DATE_Y_S1  = 0.36;   // Seller 1 date
const SIG_Y_S2   = 0.50;   // Seller 2 signature (below)
const DATE_Y_S2  = 0.58;   // Seller 2 date
const SIG_Y_BUY  = 0.28;   // Buyer signature (same row as Seller 1)
const DATE_Y_BUY = 0.36;   // Buyer date
const SIG_W      = 0.38;
const SIG_H      = 0.055;
const DATE_W     = 0.24;
const DATE_H     = 0.038;
const LEFT_X     = 0.04;
const RIGHT_X    = 0.56;

// ── Helper ────────────────────────────────────────────────────────────────────

function initialsFields(pageCount, hasSeller2) {
  const fields = [];
  for (let p = 1; p <= pageCount; p++) {
    // Seller 1 initials
    fields.push({ type: "initials", label: "Seller 1 Initials", page: p, x: SELLER1_INIT_X, y: INITIALS.y, width: INITIALS.w, height: INITIALS.h, signerIndex: 0, required: true });
    // Seller 2 initials (if template has 2 sellers)
    if (hasSeller2) {
      fields.push({ type: "initials", label: "Seller 2 Initials", page: p, x: SELLER2_INIT_X, y: INITIALS.y, width: INITIALS.w, height: INITIALS.h, signerIndex: 1, required: false });
    }
    // Buyer initials
    const buyerIdx = hasSeller2 ? 2 : 1;
    fields.push({ type: "initials", label: "Buyer Initials", page: p, x: BUYER_INIT_X, y: INITIALS.y, width: INITIALS.w, height: INITIALS.h, signerIndex: buyerIdx, required: true });
  }
  return fields;
}

function signatureFields(lastPage, hasSeller2) {
  const buyerIdx = hasSeller2 ? 2 : 1;
  return [
    // Seller 1
    { type: "signature", label: "Seller 1 Signature", page: lastPage, x: LEFT_X, y: SIG_Y_S1, width: SIG_W, height: SIG_H, signerIndex: 0, required: true },
    { type: "date",      label: "Seller 1 Date",      page: lastPage, x: LEFT_X, y: DATE_Y_S1, width: DATE_W, height: DATE_H, signerIndex: 0, required: true },
    // Seller 2
    ...(hasSeller2 ? [
      { type: "signature", label: "Seller 2 Signature", page: lastPage, x: LEFT_X, y: SIG_Y_S2, width: SIG_W, height: SIG_H, signerIndex: 1, required: false },
      { type: "date",      label: "Seller 2 Date",      page: lastPage, x: LEFT_X, y: DATE_Y_S2, width: DATE_W, height: DATE_H, signerIndex: 1, required: false },
    ] : []),
    // Buyer
    { type: "signature", label: "Buyer Signature", page: lastPage, x: RIGHT_X, y: SIG_Y_BUY, width: SIG_W, height: SIG_H, signerIndex: buyerIdx, required: true },
    { type: "date",      label: "Buyer Date",      page: lastPage, x: RIGHT_X, y: DATE_Y_BUY, width: DATE_W, height: DATE_H, signerIndex: buyerIdx, required: true },
  ];
}

// ── Template definitions ──────────────────────────────────────────────────────

const TEMPLATES = [
  {
    type:        "flex_equity",
    name:        "Flex Equity Program",
    pageCount:   6,  // v2_1 PDF — signature page is page 6
    hasSeller2:  true,
    signerCount: 3,
  },
  {
    type:        "cash_offer",
    name:        "Cash Offer",
    pageCount:   4,  // generated PDF is typically 4 pages
    hasSeller2:  true,
    signerCount: 3,
  },
  {
    type:        "listing",
    name:        "Listing Agreement",
    pageCount:   3,  // will vary by upload; positions are static so this is a default
    hasSeller2:  false,
    signerCount: 2,
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

for (const tmpl of TEMPLATES) {
  console.log(`\nProcessing: ${tmpl.name} (${tmpl.pageCount} pages)`);

  // Upsert template record
  const [row] = await sql`
    INSERT INTO "AgreementTemplate" (id, type, name, "signerCount", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${tmpl.type}, ${tmpl.name}, ${tmpl.signerCount}, now(), now())
    ON CONFLICT (type) DO UPDATE SET "signerCount" = ${tmpl.signerCount}, "updatedAt" = now()
    RETURNING id
  `;
  const templateId = row.id;
  console.log(`  Template id: ${templateId}`);

  // Wipe existing fields so we don't duplicate on re-run
  await sql`DELETE FROM "TemplateField" WHERE "templateId" = ${templateId}`;

  const fields = [
    ...initialsFields(tmpl.pageCount, tmpl.hasSeller2),
    ...signatureFields(tmpl.pageCount, tmpl.hasSeller2),
  ];

  for (const f of fields) {
    await sql`
      INSERT INTO "TemplateField"
        (id, "templateId", type, label, page, x, y, width, height, "signerIndex", required, "createdAt")
      VALUES
        (gen_random_uuid(), ${templateId}, ${f.type}, ${f.label}, ${f.page},
         ${f.x}, ${f.y}, ${f.width}, ${f.height}, ${f.signerIndex}, ${f.required}, now())
    `;
  }

  console.log(`  ✓ Inserted ${fields.length} fields`);
}

console.log("\nDone — template fields seeded.");
