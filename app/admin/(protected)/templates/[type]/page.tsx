import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import PdfFieldEditor from "./PdfFieldEditor";
import { saveTemplateFields } from "./actions";

export const metadata: Metadata = { title: "Edit Fields | Highlander REI" };

const TEMPLATE_NAMES: Record<string, string> = {
  cash_offer:   "Cash Offer",
  flex_equity:  "Flex Equity Program",
  listing:      "Listing Agreement",
  aif_novation: "AIF / Novation Agreement",
};

const SIGNER_LABELS: Record<string, string[]> = {
  cash_offer:   ["Seller 1", "Seller 2", "Buyer"],
  flex_equity:  ["Seller 1", "Seller 2", "Buyer"],
  listing:      ["Seller", "Buyer"],
  aif_novation: ["Seller 1", "Seller 2", "Buyer"],
};

const VALID_TYPES = ["cash_offer", "flex_equity", "listing", "aif_novation"];
const REQUIRED_SIGNER_COUNTS: Record<string, number> = {
  cash_offer: 3,
  flex_equity: 3,
  aif_novation: 3,
  listing: 2,
};

export default async function TemplateFieldsPage({ params }: { params: Promise<{ type: string }> }) {
  await requireAdmin();
  const { type } = await params;
  if (!VALID_TYPES.includes(type)) redirect("/admin/templates");

  const template = await prisma.agreementTemplate.findUnique({
    where: { type },
    include: { fields: { orderBy: { page: "asc" } } },
  });

  const saveWithType = saveTemplateFields.bind(null, type);

  return (
    <div style={{ margin: "-32px" }}>
      {/* Top bar */}
      <div style={{ background: "#111110", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "12px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <Link href="/admin/templates" style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>← Templates</Link>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
        <span style={{ fontFamily: "var(--font-display), serif", fontSize: "14px", letterSpacing: "2px", color: "#f5f4f0" }}>
          {TEMPLATE_NAMES[type]?.toUpperCase() ?? type.toUpperCase()} — FIELDS
        </span>
        {template?.fields.length ? (
          <span style={{ fontSize: "11px", background: "rgba(184,150,46,0.15)", color: "#B8962E", border: "1px solid rgba(184,150,46,0.3)", borderRadius: "20px", padding: "2px 8px", marginLeft: "4px" }}>
            {template.fields.length} field{template.fields.length !== 1 ? "s" : ""} saved
          </span>
        ) : null}
      </div>

      <PdfFieldEditor
        pdfUrl={template?.pdfUrl ?? null}
        initialFields={(template?.fields ?? []).map(f => ({ ...f, label: f.label ?? undefined }))}
        initialSignerCount={Math.max(template?.signerCount ?? 1, REQUIRED_SIGNER_COUNTS[type] ?? 2)}
        signerLabels={SIGNER_LABELS[type]}
        onSave={saveWithType}
      />
    </div>
  );
}
