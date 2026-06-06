import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token, signerName, signatureData, signatureType, fieldData } = await req.json();
    if (!token || !signerName) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Try new AgreementSigner system first
    const signer = await prisma.agreementSigner.findUnique({
      where: { token },
      include: { agreement: { include: { signers: true } } },
    });

    if (signer) {
      if (signer.signedAt) return NextResponse.json({ error: "Already signed" }, { status: 409 });

      const storedData = {
        ...(typeof fieldData === "object" && fieldData !== null ? fieldData : {}),
        ...(signatureData   ? { signatureData }   : {}),
        ...(signatureType   ? { signatureType }   : {}),
      };

      await prisma.agreementSigner.update({
        where: { id: signer.id },
        data: {
          signedAt:  new Date(),
          fieldData: Object.keys(storedData).length > 0 ? storedData : undefined,
        },
      });

      // If all signers have now signed, mark agreement completed
      const allSigned = signer.agreement.signers.every(
        s => s.id === signer.id || !!s.signedAt
      );
      if (allSigned) {
        await prisma.agreement.update({
          where: { id: signer.agreementId },
          data:  { status: "completed" },
        });
      }

      return NextResponse.json({ ok: true });
    }

    // Fallback: legacy Agreement.signerToken
    const agreement = await prisma.agreement.findUnique({ where: { signerToken: token } });
    if (!agreement) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (agreement.signedAt) return NextResponse.json({ error: "Already signed" }, { status: 409 });

    await prisma.agreement.update({
      where: { id: agreement.id },
      data: {
        signedAt:   new Date(),
        signerName: signerName.trim(),
        status:     "signed",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Sign error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
