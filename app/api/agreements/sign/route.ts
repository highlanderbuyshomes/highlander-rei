import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const MAX_REQUEST_SIZE = 750_000;
const MAX_SIGNATURE_SIZE = 500_000;
const MAX_FIELDS = 50;

function invalid(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function cleanFields(value: unknown): Record<string, string> | null {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const entries = Object.entries(value);
  if (entries.length > MAX_FIELDS) return null;

  const fields: Record<string, string> = {};
  for (const [key, fieldValue] of entries) {
    if (key.length > 100 || typeof fieldValue !== "string" || fieldValue.length > 2_000) return null;
    fields[key] = fieldValue;
  }
  return fields;
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_REQUEST_SIZE) return invalid("Signature submission is too large.", 413);

    const { token, signerName, signatureData, signatureType, fieldData } = await req.json();
    if (typeof token !== "string" || !token || token.length > 100) return invalid("Invalid signing link.");
    if (typeof signerName !== "string" || !signerName.trim() || signerName.length > 200) return invalid("A valid signer name is required.");
    if (signatureType !== "draw" && signatureType !== "type") return invalid("Choose a valid signature method.");
    if (typeof signatureData !== "string" || !signatureData || signatureData.length > MAX_SIGNATURE_SIZE) return invalid("A valid signature is required.");
    if (signatureType === "draw" && !signatureData.startsWith("data:image/png;base64,")) return invalid("Drawn signature data is invalid.");
    if (signatureType === "type" && signatureData.trim() !== signerName.trim()) return invalid("Typed signature must match the signer name.");

    const cleanedFields = cleanFields(fieldData);
    if (!cleanedFields) return invalid("One or more agreement fields are invalid.");

    // Try new AgreementSigner system first
    const signer = await prisma.agreementSigner.findUnique({
      where: { token },
      include: { agreement: true },
    });

    if (signer) {
      if (signer.signedAt) return NextResponse.json({ error: "Already signed" }, { status: 409 });
      if (signer.agreement.status === "void") return invalid("This agreement has been voided.", 409);
      if (!signer.agreement.pdfUrl) return invalid("This agreement document is unavailable.", 409);

      const storedData = {
        ...cleanedFields,
        signatureData,
        signatureType,
      };

      const updated = await prisma.agreementSigner.updateMany({
        where: { id: signer.id, signedAt: null },
        data: {
          signedAt:  new Date(),
          fieldData: storedData,
        },
      });
      if (updated.count === 0) return invalid("This agreement has already been signed.", 409);

      const remaining = await prisma.agreementSigner.count({
        where: { agreementId: signer.agreementId, signedAt: null },
      });
      if (remaining === 0) {
        await prisma.agreement.updateMany({
          where: { id: signer.agreementId, status: { not: "void" } },
          data:  { status: "completed" },
        });
      }

      return NextResponse.json({ ok: true });
    }

    // Fallback: legacy Agreement.signerToken
    const agreement = await prisma.agreement.findUnique({ where: { signerToken: token } });
    if (!agreement) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (agreement.signedAt) return NextResponse.json({ error: "Already signed" }, { status: 409 });
    if (agreement.status === "void") return invalid("This agreement has been voided.", 409);
    if (!agreement.pdfUrl) return invalid("This agreement document is unavailable.", 409);

    const updated = await prisma.agreement.updateMany({
      where: { id: agreement.id, signedAt: null, status: { not: "void" } },
      data: {
        signedAt:   new Date(),
        signerName: signerName.trim(),
        status:     "signed",
      },
    });
    if (updated.count === 0) return invalid("This agreement has already been signed or voided.", 409);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Sign error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
