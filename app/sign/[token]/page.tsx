import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SignatureForm from "./SignatureForm";
import { resolveAgreementFields, type AgreementField } from "@/lib/agreement-fields";

const TYPE_LABELS: Record<string, string> = {
  cash_offer:   "Cash Offer",
  flex_equity:  "Flex Equity Program",
  listing:      "Listing Agreement",
  aif_novation: "AIF / Novation Agreement",
};

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const signer = await prisma.agreementSigner.findUnique({
    where: { token },
    include: { agreement: true },
  });

  if (signer) {
    const a = signer.agreement;
    const alreadySigned = !!signer.signedAt;

    const template = await prisma.agreementTemplate.findUnique({
      where: { type: a.type },
      include: { fields: { orderBy: { page: "asc" } } },
    });
    const signerCount = await prisma.agreementSigner.count({ where: { agreementId: a.id } });
    const customFields = Array.isArray(a.customFields)
      ? (a.customFields as AgreementField[]).map((field, index) => ({ ...field, id: field.id ?? `cf-${index}` }))
      : null;
    const agreementFields = customFields ?? resolveAgreementFields((template?.fields ?? []).map((field) => ({
      ...field,
      label: field.label ?? undefined,
    })), {
      type: a.type,
      seller2Name: a.seller2Name,
      signerCount,
    });
    const signerFields = agreementFields.filter((field) => field.signerIndex === signer.order);

    return (
      <SignLayout
        type={a.type}
        address={a.address}
        sellers={a.sellers}
        signerName={signer.name}
        pdfUrl={a.pdfUrl}
        alreadySigned={alreadySigned}
        signedAt={signer.signedAt ? signer.signedAt.toISOString() : null}
        token={token}
        fields={signerFields.map(f => ({
          id: f.id, type: f.type, label: f.label ?? f.type,
          page: f.page, x: f.x, y: f.y, width: f.width, height: f.height,
        }))}
      />
    );
  }

  // Legacy single-signer
  const a = await prisma.agreement.findUnique({ where: { signerToken: token } });
  if (!a) notFound();

  return (
    <SignLayout
      type={a.type}
      address={a.address}
      sellers={a.sellers}
      signerName={a.signerName ?? ""}
      pdfUrl={a.pdfUrl}
      alreadySigned={!!a.signedAt}
      signedAt={a.signedAt ? a.signedAt.toISOString() : null}
      token={token}
      fields={[]}
    />
  );
}

function SignLayout({
  type, address, sellers, signerName, pdfUrl, alreadySigned, signedAt, token, fields,
}: {
  type: string; address: string; sellers: string; signerName: string | null;
  pdfUrl: string | null; alreadySigned: boolean; signedAt: string | null;
  token: string; fields: { id: string; type: string; label: string; page: number; x: number; y: number; width: number; height: number }[];
}) {
  const label = TYPE_LABELS[type] ?? type;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top bar — blue */}
      <div style={{ background: "#1a56db", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", position: "sticky", top: 0, zIndex: 10 }}>
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", letterSpacing: "1.5px" }}>HIGHLANDER REI</span>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: "20px" }}>
          {label}
        </span>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 16px 40px" }}>

        {/* Document card */}
        <div style={{ background: "#f0f4ff", borderRadius: "12px", padding: "16px 18px", marginBottom: "16px", borderLeft: "3px solid #1a56db" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#1a56db", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
            Document to Sign
          </div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", marginBottom: "3px" }}>{label}</div>
          <div style={{ fontSize: "13px", color: "#475569" }}>{address}</div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Seller(s): {sellers}</div>
          {signerName && (
            <div style={{ fontSize: "12px", color: "#64748b" }}>Signing as: <strong style={{ color: "#0f172a" }}>{signerName}</strong></div>
          )}
        </div>

        {/* PDF viewer */}
        {pdfUrl && (
          <div style={{ marginBottom: "16px" }}>
            {/* Mobile: link button */}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                width: "100%", padding: "14px", background: "#ffffff", border: "1.5px solid #1a56db",
                borderRadius: "10px", color: "#1a56db", fontSize: "14px", fontWeight: 600,
                textDecoration: "none", boxSizing: "border-box",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              View Agreement PDF
            </a>
            <p style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", marginTop: "6px", marginBottom: 0 }}>
              Review the full document before signing
            </p>
          </div>
        )}

        {/* Signed state */}
        {alreadySigned ? (
          <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "14px", padding: "32px 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, background: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#15803d", marginBottom: "8px" }}>Agreement Signed</div>
            {signedAt && (
              <div style={{ fontSize: "13px", color: "#166534" }}>
                Signed on {new Date(signedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            )}
            <div style={{ fontSize: "12px", color: "#4ade80", marginTop: "6px" }}>You&apos;ll receive a copy once all parties have signed.</div>
          </div>
        ) : (
          <SignatureForm
            token={token}
            signerName={signerName ?? ""}
            fields={fields}
          />
        )}

        <div style={{ textAlign: "center", marginTop: "28px", fontSize: "11px", color: "#cbd5e1" }}>
          Secured by Highlander REI · Legally binding electronic signatures
        </div>
      </div>
    </div>
  );
}
