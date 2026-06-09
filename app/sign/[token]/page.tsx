import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SignatureForm from "./SignatureForm";
import { getInitialSigningFields, isAgreementDataField, type AgreementField } from "@/lib/agreement-fields";

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
    const savedCustomFields = Array.isArray(a.customFields)
      ? (a.customFields as AgreementField[])
          .filter((field) => !isAgreementDataField(field))
          .map((field, index) => ({ ...field, id: field.id ?? `cf-${index}` }))
      : [];
    const customFields = savedCustomFields.length > 0 ? savedCustomFields : null;
    const agreementFields = customFields ?? getInitialSigningFields((template?.fields ?? []).map((field) => ({
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
        signerName={signer.name}
        pdfUrl={a.pdfUrl}
        alreadySigned={alreadySigned}
        signedAt={signer.signedAt ? signer.signedAt.toISOString() : null}
        token={token}
        fields={signerFields.map((f, index) => ({
          id: f.id ?? `field-${index}`, type: f.type, label: f.label ?? f.type,
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
  type, address, signerName, pdfUrl, alreadySigned, signedAt, token, fields,
}: {
  type: string; address: string; signerName: string | null;
  pdfUrl: string | null; alreadySigned: boolean; signedAt: string | null;
  token: string; fields: { id: string; type: string; label: string; page: number; x: number; y: number; width: number; height: number }[];
}) {
  const label = TYPE_LABELS[type] ?? type;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "system-ui, -apple-system, sans-serif", color: "#111110" }}>
      <div style={{ height: "62px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", position: "sticky", top: 0, zIndex: 10, background: "rgba(255,255,255,0.96)", borderBottom: "1px solid #eeeeef" }}>
        <span style={{ fontSize: "14px", fontWeight: 750, color: "#111110", letterSpacing: "1.7px" }}>HIGHLANDER REI</span>
        <span style={{ fontSize: "10px", color: "#777781", background: "#f2f2f4", padding: "5px 10px", borderRadius: "20px", fontWeight: 700 }}>
          {label}
        </span>
      </div>

      <main style={{ maxWidth: "920px", margin: "0 auto", padding: "32px 20px 54px" }}>
        {alreadySigned ? (
          <div style={{ padding: "72px 22px", textAlign: "center" }}>
            <div style={{ width: 58, height: 58, background: "#111110", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontSize: "25px", fontWeight: 750, color: "#111110", marginBottom: "8px", letterSpacing: "-0.5px" }}>Agreement signed</div>
            {signedAt && (
              <div style={{ fontSize: "13px", color: "#777781" }}>
                Signed on {new Date(signedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            )}
            {pdfUrl && <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: "18px", color: "#111110", fontSize: "13px", fontWeight: 700 }}>Review document</a>}
          </div>
        ) : (
          <SignatureForm
            token={token}
            signerName={signerName ?? ""}
            fields={fields}
            documentLabel={label}
            address={address}
            pdfUrl={pdfUrl}
          />
        )}

        <div style={{ textAlign: "center", marginTop: "34px", fontSize: "10px", color: "#b0b0b7", letterSpacing: "0.3px" }}>
          Secured by Highlander REI · Legally binding electronic signatures
        </div>
      </main>
    </div>
  );
}
