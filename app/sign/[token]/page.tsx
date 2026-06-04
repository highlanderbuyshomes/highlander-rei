import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SignatureForm from "./SignatureForm";

const TYPE_LABELS: Record<string, string> = {
  cash_offer:  "Cash Offer",
  flex_equity: "Flex Equity Program",
  listing:     "Listing Agreement",
};

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const a = await prisma.agreement.findUnique({ where: { signerToken: token } });
  if (!a) notFound();

  const alreadySigned = !!a.signedAt;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: "#111110", height: "52px", display: "flex", alignItems: "center", padding: "0 28px" }}>
        <span style={{ fontFamily: "var(--font-display), serif", fontSize: "16px", letterSpacing: "3px", color: "#f5f4f0" }}>HIGHLANDER REI</span>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "24px 28px", marginBottom: "16px" }}>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "22px", color: "#111110", letterSpacing: "2px", marginBottom: "6px" }}>
            {TYPE_LABELS[a.type]?.toUpperCase() ?? a.type.toUpperCase()}
          </div>
          <div style={{ fontSize: "13.5px", color: "#5a5a54", marginBottom: "4px" }}>{a.address}</div>
          <div style={{ fontSize: "12px", color: "#8a8a84" }}>Seller(s): {a.sellers}</div>
        </div>

        {/* PDF Viewer */}
        {a.pdfUrl && (
          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden", marginBottom: "16px", height: "600px" }}>
            <iframe src={a.pdfUrl} style={{ width: "100%", height: "100%", border: "none" }} title="Agreement" />
          </div>
        )}

        {!a.pdfUrl && (
          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "24px", marginBottom: "16px", textAlign: "center", color: "#8a8a84", fontSize: "13px" }}>
            Document will be attached by Highlander REI. Please review all details before signing.
          </div>
        )}

        {/* Signed state */}
        {alreadySigned ? (
          <div style={{ background: "#eaf6f0", border: "1px solid #b8dfc8", borderRadius: "14px", padding: "28px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
            <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#3a7a50", letterSpacing: "1.5px", marginBottom: "8px" }}>AGREEMENT SIGNED</div>
            <div style={{ fontSize: "13px", color: "#5a5a54" }}>
              Signed by {a.signerName ?? "signer"} on {new Date(a.signedAt!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
        ) : (
          <SignatureForm token={token} signerName={a.signerName ?? ""} />
        )}

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "11px", color: "#aaa" }}>
          Powered by Highlander REI · Secure Document Signing
        </div>
      </div>
    </div>
  );
}
